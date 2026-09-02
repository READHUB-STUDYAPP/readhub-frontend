import { ReadHubImages } from '../assets/asset';

/**
 * The opening screen, and nothing else.
 *
 * Purely visual, so it serves two callers: the boot gate that shows it on every
 * page load, and the `/` route that shows it while deciding where to send a
 * reader.
 *
 * The wordmark is text rather than part of the image. A splash whose only
 * content is one PNG shows nothing at all if that request is slow or fails --
 * which is exactly the moment a reader is deciding whether the app is working.
 */
export default function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand px-4">
      <img
        src={ReadHubImages.FirstOnboardingImageIcon}
        alt=""
        width={112}
        height={112}
        className="h-28 w-28 object-contain"
      />

      <p className="text-headline_Small font-extrabold tracking-tight text-white">ReadHub</p>
      <p className="text-body_Medium text-white/85">Read. Track. Stay Consistent</p>
    </div>
  );
}
