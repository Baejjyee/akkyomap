import { useEffect, useState } from 'react'

export type KakaoMapScriptStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'missing-services'
  | 'error'

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk'

function getKakaoMapScriptSrc(appKey: string) {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
}

function hasKakaoServices() {
  return Boolean(window.kakao?.maps?.services?.Places)
}

export function useKakaoMapScript(): KakaoMapScriptStatus {
  const [status, setStatus] = useState<KakaoMapScriptStatus>('idle')

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined

    if (!appKey) {
      setStatus('error')
      return
    }

    if (hasKakaoServices()) {
      setStatus('ready')
      return
    }

    if (window.kakao?.maps && !hasKakaoServices()) {
      setStatus('missing-services')
      return
    }

    const existingScript = document.getElementById(
      KAKAO_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        setStatus('error')
        return
      }
      window.kakao.maps.load(() => {
        setStatus(hasKakaoServices() ? 'ready' : 'missing-services')
      })
    }

    const handleError = () => setStatus('error')

    if (existingScript) {
      if (
        existingScript.dataset.loaded === 'true' ||
        window.kakao?.maps ||
        existingScript.src
      ) {
        const hasServicesLibrary = existingScript.src.includes(
          'libraries=services',
        )

        if (!hasServicesLibrary) {
          setStatus('missing-services')
          return
        }

        if (window.kakao?.maps && !hasKakaoServices()) {
          setStatus('missing-services')
          return
        }
      }

      setStatus('loading')
      existingScript.addEventListener('load', handleLoad)
      existingScript.addEventListener('error', handleError)

      return () => {
        existingScript.removeEventListener('load', handleLoad)
        existingScript.removeEventListener('error', handleError)
      }
    }

    setStatus('loading')

    const script = document.createElement('script')
    script.id = KAKAO_MAP_SCRIPT_ID
    script.src = getKakaoMapScriptSrc(appKey)
    script.async = true
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
    })
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
  }, [])

  return status
}
