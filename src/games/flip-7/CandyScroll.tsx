import type { ComponentProps } from 'preact';
import { SeaScroll } from '../../shared/SeaScroll';

/** Flip 7 scroll area: a gold foil candy slides along a candy-stripe track. */
export function CandyScroll(props: Omit<ComponentProps<typeof SeaScroll>, 'thumb' | 'trackClass'>) {
  return (
    <SeaScroll
      {...props}
      trackClass="f7-track"
      thumb={
        <span class="f7-thumb">
          <span class="f7-thumb__candy" />
        </span>
      }
    />
  );
}
