export const ROUTES = {
  // Marketing
  home: '/',
  pricing: '/precos',
  trialSignup: '/cadastrar-trial',
  terms: '/termos-de-uso',
  privacy: '/privacidade',

  // Auth
  login: '/entrar',
  signup: '/cadastrar',
  confirmEmail: '/cadastrar/confirmar',
  forgotPassword: '/recuperar-senha',

  // Onboarding
  onboarding: '/nova-loja',
  onboardingStep1: '/nova-loja/etapa-um',
  onboardingStep2: '/nova-loja/etapa-dois',
  onboardingStep3: '/nova-loja/etapa-tres',
  onboardingStep4: '/nova-loja/etapa-quatro',
  onboardComplete: '/onboard-complete',

  // Dashboard
  dashboard: '/dashboard',
  dashboardProfile: '/dashboard/perfil',
  dashboardOrders: '/dashboard/pedidos',
  dashboardOrdersNew: '/dashboard/pedidos/novo',
  dashboardProducts: '/dashboard/produtos',
  dashboardProductsBulk: '/dashboard/produtos/bulk',
  dashboardCustomers: '/dashboard/clientes',
  dashboardCustomersNew: '/dashboard/clientes/novo',
  dashboardCustomersEdit: '/dashboard/clientes/:id',
  dashboardSellers: '/dashboard/vendedores',
  dashboardCoupons: '/dashboard/cupons',
  dashboardCatalog: '/dashboard/catalogo',
  dashboardCategories: '/dashboard/categorias',
  dashboardBilling: '/dashboard/assinatura',
  dashboardSupport: '/dashboard/suporte',

  // Admin
  admin: '/admin',
  adminStores: '/admin/lojas',
  adminStore: '/admin/lojas/:id',

  // Store (resolved from the first path segment — paths are relative to the store root)
  storeHome: '/',
  storeProduct: '/produto/:slug',
  storeCart: '/carrinho',
  storeCheckout: '/checkout',
  storeOrderConfirmation: '/pedido/:id',
  storeAbout: '/sobre',
  storeCoupon: '/c/:slug',
} as const
