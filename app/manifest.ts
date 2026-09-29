import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lily',
    short_name: 'Lily',
    start_url: '/today',
    display: 'standalone',
    background_color: '#FBF6EE',
    theme_color: '#297045',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}