import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Product, Store } from '@/types/domain'
import { effectivePrice } from '@/features/products/utils/price'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 700,
    },
  ],
})

function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
}

type CatalogPdfProps = {
  store: Store
  products: Product[]
  storeUrl: string
}

export function CatalogPdf({ store, products, storeUrl }: CatalogPdfProps) {
  const primary = store.primary_color ?? '#00a82d'
  const activeProducts = products.filter((p) => p.is_active && !p.deleted_at)

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Inter',
      backgroundColor: '#f9fafb',
      paddingBottom: 60,
    },
    // ── Header ──────────────────────────────────────────────
    header: {
      backgroundColor: primary,
      paddingHorizontal: 36,
      paddingVertical: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    logo: {
      width: 60,
      height: 60,
      borderRadius: 12,
      objectFit: 'cover',
      backgroundColor: '#ffffff33',
    },
    logoFallback: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: '#ffffff33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoFallbackText: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: 700,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    storeName: {
      fontSize: 22,
      fontWeight: 700,
      color: '#ffffff',
    },
    storeSlogan: {
      fontSize: 11,
      fontWeight: 400,
      color: '#ffffffcc',
    },
    headerContact: {
      alignItems: 'flex-end',
      gap: 4,
    },
    headerContactText: {
      fontSize: 9,
      color: '#ffffffcc',
    },
    headerContactBold: {
      fontSize: 10,
      color: '#ffffff',
      fontWeight: 600,
    },
    // ── Body ────────────────────────────────────────────────
    body: {
      paddingHorizontal: 28,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: '#374151',
      marginBottom: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    // ── Product Grid ────────────────────────────────────────
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    card: {
      width: '31.5%',
      backgroundColor: '#ffffff',
      borderRadius: 10,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
    },
    cardImage: {
      width: '100%',
      height: 120,
      objectFit: 'cover',
      backgroundColor: '#f3f4f6',
    },
    cardImagePlaceholder: {
      width: '100%',
      height: 120,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardImagePlaceholderText: {
      fontSize: 9,
      color: '#9ca3af',
    },
    cardBody: {
      padding: 10,
      gap: 4,
    },
    cardCategory: {
      fontSize: 8,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardName: {
      fontSize: 10,
      fontWeight: 600,
      color: '#111827',
      lineHeight: 1.3,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    cardPrice: {
      fontSize: 12,
      fontWeight: 700,
      color: primary,
    },
    cardOldPrice: {
      fontSize: 9,
      color: '#9ca3af',
      textDecoration: 'line-through',
    },
    cardBadge: {
      backgroundColor: `${primary}22`,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    cardBadgeText: {
      fontSize: 8,
      fontWeight: 700,
      color: primary,
    },
    // ── Empty state ─────────────────────────────────────────
    empty: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 11,
      color: '#9ca3af',
    },
    // ── Footer ──────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#f3f4f6',
      borderTop: '1px solid #e5e7eb',
      paddingHorizontal: 36,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerLeft: {
      gap: 2,
    },
    footerUrl: {
      fontSize: 9,
      fontWeight: 600,
      color: primary,
    },
    footerDate: {
      fontSize: 8,
      color: '#9ca3af',
    },
    footerRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    footerBrand: {
      fontSize: 8,
      color: '#9ca3af',
    },
    footerTotal: {
      fontSize: 9,
      color: '#6b7280',
    },
  })

  const hasWhatsapp = !!store.whatsapp_phone
  const whatsappDisplay = store.whatsapp_phone
    ? store.whatsapp_phone.replace(/^55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    : null

  return (
    <Document
      title={`Catálogo ${store.name}`}
      author={store.name}
      subject="Catálogo de produtos"
      language="pt-BR"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          {store.logo_url ? (
            <Image src={store.logo_url} style={styles.logo} />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>
                {store.name[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <View style={styles.headerText}>
            <Text style={styles.storeName}>{store.name}</Text>
            {store.slogan && (
              <Text style={styles.storeSlogan}>{store.slogan}</Text>
            )}
          </View>

          <View style={styles.headerContact}>
            {hasWhatsapp && (
              <>
                <Text style={styles.headerContactText}>WhatsApp</Text>
                <Text style={styles.headerContactBold}>{whatsappDisplay}</Text>
              </>
            )}
            {store.contact_email && (
              <Text style={styles.headerContactText}>{store.contact_email}</Text>
            )}
          </View>
        </View>

        {/* ── Products ── */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>
            {activeProducts.length > 0
              ? `${activeProducts.length} produto${activeProducts.length !== 1 ? 's' : ''}`
              : 'Produtos'}
          </Text>

          {activeProducts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum produto ativo no catálogo.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {activeProducts.map((product) => {
                const price = effectivePrice(product)
                const hasPromo =
                  product.promo_price_in_cents != null &&
                  product.promo_price_in_cents < product.price_in_cents
                const discountPct = hasPromo
                  ? Math.round(
                      (1 - product.promo_price_in_cents! / product.price_in_cents) * 100,
                    )
                  : null
                const firstImage = product.images?.[0] ?? null

                return (
                  <View key={product.id} style={styles.card}>
                    {firstImage ? (
                      <Image src={firstImage} style={styles.cardImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardImagePlaceholderText}>sem foto</Text>
                      </View>
                    )}

                    <View style={styles.cardBody}>
                      {product.category && (
                        <Text style={styles.cardCategory}>{product.category}</Text>
                      )}
                      <Text style={styles.cardName}>
                        {product.name}
                      </Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>{formatBRL(price)}</Text>
                        {hasPromo && (
                          <>
                            <Text style={styles.cardOldPrice}>
                              {formatBRL(product.price_in_cents)}
                            </Text>
                            {discountPct != null && (
                              <View style={styles.cardBadge}>
                                <Text style={styles.cardBadgeText}>
                                  -{discountPct}%
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerUrl}>{storeUrl}</Text>
            <Text style={styles.footerDate}>Gerado em {formatDate()}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerBrand}>Criado com Zapable</Text>
            <Text style={styles.footerTotal}>
              {activeProducts.length} produto{activeProducts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
