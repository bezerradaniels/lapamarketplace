import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from '../../../locales/pt-BR.json'

i18n.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  resources: {
    'pt-BR': ptBR,
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
