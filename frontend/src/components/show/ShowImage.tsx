import type { ShowImage as Img } from '../../data/show'

export default function ShowImage({ image, title }: { image: Img; title: string }) {
  return (
    <figure>
      <img src={image.url} alt={`${title}, promotional image`} className="w-full max-h-96 rounded-lg object-cover" />
      <figcaption className="mt-1 text-xs text-neutral-400 break-words">
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
