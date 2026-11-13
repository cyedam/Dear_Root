export const ROUTES = {
  main: '/',
  careTest: '/care-test',
  products: '/products',
  guide: '/guide',
}

// GNB · 푸터 메뉴 (GNB-02 ~ GNB-04)
export const NAV_ITEMS = [
  { label: '맞춤 케어 체험', to: ROUTES.careTest },
  { label: '케어 제품', to: ROUTES.products },
  { label: '케어 가이드', to: ROUTES.guide },
]
