import NextLink from '@/section/reference/link';
import config from '@/section/config/website-config';
import { publicAssetUrl } from '@/section/reference/public-asset-url';

import { Container } from './container';
import { HeaderLogo } from './header-logo';
import { StickyHeader } from './sticky-header';
import { Button } from './ui/button';

interface IHeaderProps {
  className?: string;
}

function Header({ className }: IHeaderProps) {
  return (
    <StickyHeader className={className} data-default-site-chrome>
      <Container className="flex h-11 items-center justify-between">
        <NextLink className="inline-flex shrink-0 rounded" href={publicAssetUrl('')} aria-label={config.projectName}>
          <HeaderLogo />
        </NextLink>

        <Button className="rounded-full text-grey-100" size="header" asChild>
          <NextLink href={config.bookCallUrl}>
            See the story
          </NextLink>
        </Button>
      </Container>
    </StickyHeader>
  );
}

export default Header;
