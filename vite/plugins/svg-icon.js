import fs from 'fs'
import path from 'path'

const virtualModuleId = 'virtual:svg-icons-register'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export default function createSvgIcon() {
  const iconDir = path.resolve(process.cwd(), 'src/assets/icons/svg')
  return {
    name: 'local-svg-icons',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },
    load(id) {
      if (id === resolvedVirtualModuleId) return createRegisterModule(iconDir)
    },
    configureServer(server) {
      server.watcher.add(iconDir)
      server.watcher.on('change', (file) => {
        if (file.endsWith('.svg')) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (mod) server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      })
    }
  }
}

function createRegisterModule(iconDir) {
  const sprite = createSprite(iconDir)
  return `
const sprite = ${JSON.stringify(sprite)}
const id = '__svg__icons__dom__'
const mount = () => {
  let svg = document.getElementById(id)
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = id
    svg.style.position = 'absolute'
    svg.style.width = '0'
    svg.style.height = '0'
    svg.style.overflow = 'hidden'
    svg.setAttribute('aria-hidden', 'true')
    document.body.insertBefore(svg, document.body.firstChild)
  }
  svg.innerHTML = sprite
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true })
} else {
  mount()
}
export default {}
`
}

function createSprite(iconDir) {
  if (!fs.existsSync(iconDir)) return ''
  return fs.readdirSync(iconDir)
    .filter((file) => file.endsWith('.svg'))
    .sort()
    .map((file) => {
      const name = path.basename(file, '.svg')
      const raw = fs.readFileSync(path.join(iconDir, file), 'utf8')
      return toSymbol(raw, `icon-${name}`)
    })
    .join('')
}

function toSymbol(svg, id) {
  const svgMatch = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)
  if (!svgMatch) return ''
  const attrs = svgMatch[1]
  const body = svgMatch[2]
  const viewBoxMatch = attrs.match(/\bviewBox=(["'])(.*?)\1/i)
  const widthMatch = attrs.match(/\bwidth=(["'])(.*?)\1/i)
  const heightMatch = attrs.match(/\bheight=(["'])(.*?)\1/i)
  let viewBox = viewBoxMatch ? viewBoxMatch[2] : ''
  if (!viewBox && widthMatch && heightMatch) {
    viewBox = `0 0 ${widthMatch[2]} ${heightMatch[2]}`
  }
  const viewBoxAttr = viewBox ? ` viewBox="${viewBox}"` : ''
  return `<symbol id="${id}"${viewBoxAttr}>${body}</symbol>`
}
