import type { ShowImage as Img } from '../../data/show'

export default function ShowImage({ image, title }: { image: Img; title: string }) {
  return (
    <figure>
      <img src={image.url} alt={`${title}, promotional image`} className="w-full max-h-72 rounded-xl object-cover shadow-lg shadow-black/50 md:max-h-80" />
      <figcaption className="mt-2 text-xs text-neutral-300 break-words">
        Image by {image.author} (<a className="text-amber-400 underline" href={image.source_url}>source</a>),{' '}
        {image.license_url ? (
          <a className="text-amber-400 underline" href={image.license_url}>{image.license}</a>
        ) : (
          image.license
        )}
      </figcaption>
    </figure>
  )
}
