import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

type Step = { uses?: string; run?: string; with?: Record<string, string> }
type Workflow = {
  on: { schedule: { cron: string }[]; workflow_dispatch: unknown }
  jobs: { refresh: { 'timeout-minutes'?: number; steps: Step[] } }
}
const wf = load(readFileSync(join(__dirname, '../../.github/workflows/refresh-data.yml'), 'utf8')) as Workflow
const steps = wf.jobs.refresh.steps
const idx = (pred: (s: Step) => boolean) => steps.findIndex(pred)
const runIdx = (cmd: string) => idx((s) => s.run?.trim() === cmd)
const filterIdx = () => idx((s) => !!s.run?.includes('generated_at'))
const prIdx = () => idx((s) => !!s.uses?.startsWith('peter-evans/create-pull-request@'))

describe('refresh-data workflow', () => {
  it('runs weekly and on demand', () => {
    expect(wf.on.schedule).toHaveLength(1)
    expect(wf.on.schedule[0].cron.split(' ')[4]).toMatch(/^(1|MON)$/i)
    expect(wf.on).toHaveProperty('workflow_dispatch')
  })

  it('has the steps in order', () => {
    const order = [
      runIdx('npm ci'),
      runIdx('npm run pull'),
      runIdx('npm run pull:catalog'),
      filterIdx(),
      runIdx('npm run typecheck'),
      runIdx('npm run lint'),
      runIdx('npm test'),
      runIdx('npm run e2e'),
      runIdx('npm run build'),
      prIdx(),
    ]
    expect(order).not.toContain(-1)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('filters timestamps in both data paths', () => {
    const run = steps[filterIdx()].run ?? ''
    expect(run).toContain('data/')
    expect(run).toContain('public/catalog/')
  })

  it('opens the PR with both directories, on a per-base branch', () => {
    const pr = steps[prIdx()]
    expect(pr.with!['add-paths']).toContain('frontend/data/')
    expect(pr.with!['add-paths']).toContain('frontend/public/catalog/')
    expect(pr.with!.branch).toContain('github.ref_name')
  })

  it('has a timeout that fits the catalogue pull', () => {
    expect(wf.jobs.refresh['timeout-minutes']).toBeGreaterThanOrEqual(45)
  })
})

describe('timestamp filter step (real shell, temp repo)', () => {
  let dir = ''
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  const sh = (cmd: string) => execFileSync('bash', ['-ec', cmd], { cwd: dir, encoding: 'utf8' })
  const doc = (stamp: string, v = 1) => JSON.stringify({ meta: { generated_at: stamp }, v }, null, 2) + '\n'
  const write = (p: string, s: string) => {
    mkdirSync(dirname(join(dir, p)), { recursive: true })
    writeFileSync(join(dir, p), s)
  }
  function setup() {
    dir = mkdtempSync(join(tmpdir(), 'refresh-'))
    write('data/shows.json', doc('t0'))
    write('public/catalog/index.json', doc('t0'))
    write('public/catalog/shows/a.json', doc('t0'))
    sh('git init -q . && git add -A && git -c user.name=t -c user.email=t@t commit -qm init')
  }
  const runFilter = () => sh(steps[filterIdx()].run ?? '')
  const status = () => sh('git status --porcelain').trim()

  it('restores a tree whose only changes are timestamps', () => {
    setup()
    write('data/shows.json', doc('t1'))
    write('public/catalog/index.json', doc('t1'))
    write('public/catalog/shows/a.json', doc('t1'))
    runFilter()
    expect(status()).toBe('')
  })

  it('keeps a real change in a shard file and drops timestamp-only ones', () => {
    setup()
    write('data/shows.json', doc('t1'))
    write('public/catalog/index.json', doc('t1'))
    write('public/catalog/shows/a.json', doc('t1', 2))
    runFilter()
    expect(status()).toBe('M public/catalog/shows/a.json')
  })

  it('keeps a new untracked shard file', () => {
    setup()
    write('public/catalog/index.json', doc('t1'))
    write('public/catalog/shows/b.json', doc('t1'))
    runFilter()
    expect(existsSync(join(dir, 'public/catalog/shows/b.json'))).toBe(true)
    expect(status()).toContain('public/catalog/shows/b.json')
    expect(status()).not.toContain('index.json')
  })

  it('keeps a deleted shard file', () => {
    setup()
    sh('rm public/catalog/shows/a.json')
    runFilter()
    expect(status()).toMatch(/^D\s+public\/catalog\/shows\/a\.json$/)
  })
})
