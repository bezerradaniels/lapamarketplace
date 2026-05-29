import { useEffect } from 'react'
import { OnboardingStep1 } from '@/features/onboarding'
import { track } from '@/features/analytics'
import { markOnboardingStarted } from '@/features/onboarding/utils/onboardingSession'

export default function OnboardingStep1Page() {
  useEffect(() => {
    markOnboardingStarted()
    track('onboarding_started', { step: 1 })
  }, [])

  return <OnboardingStep1 />
}
