export function Icon({ name }: { name: 'arrow' | 'share' | 'restart' }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    share: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13v6h14v-6" />,
    restart: <path d="M19 8a7.5 7.5 0 1 0 .3 7M19 8V3m0 5h-5" />,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">{paths[name]}</svg>
}
