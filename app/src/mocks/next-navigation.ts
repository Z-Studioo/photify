// src/mocks/next-navigation.ts
// Mock for Next.js navigation to prevent build errors with nextstepjs

export const useRouter = () => {
  return {
    push: (_href: string) => {},
    replace: (_href: string) => {},
    prefetch: (_href: string) => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    pathname: '',
    query: {},
    asPath: '',
  };
};

export const usePathname = () => {
  return '';
};

export const useSearchParams = () => {
  return new URLSearchParams();
};

export const useParams = () => {
  return {};
};
