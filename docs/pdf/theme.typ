#let logo-lines = read("../assets/portada-ascii.txt").split("\n").map(l => l.replace("\u{a0}", " ")).map(l => l.replace(regex(" +$"), "")).filter(l => l != "")

#let c = (
  text: rgb("#101010"),
  black: rgb("#000000"),
  gray: rgb("#555555"),
  soft: rgb("#8a8a8a"),
  muted: rgb("#767676"),
  th-bg: rgb("#e6e6e6"),
  th-fg: rgb("#000000"),
  line: rgb("#999999"),
  ghost: rgb("#9a9a9a"),
)

#let ascii-logo(size: 12pt, fill: c.black) = box(grid(
  columns: auto,
  align: left,
  row-gutter: 6pt,
  ..logo-lines.map(l => text(font: ("Courier New", "Courier"), weight: 700, size: size, fill: fill)[
    #if l.contains("PbtA:") {
      let idx = l.position("PbtA:")
      [#l.slice(0, idx)#box(width: 4.2em)[#text(font: "VT323", tracking: 0.2em, size: size, fill: fill, l.slice(idx, idx + 7))]#l.slice(idx + 7)]
    } else {
      [#l]
    }
  ]),
))

#let h-rule = text(size: 14pt, fill: c.gray)[===================================]

#let cover-page() = {
  set align(center)
  v(2.3cm)
  ascii-logo(size: 12pt)
  v(0.5cm)
  text(size: 16pt, fill: c.black, tracking: 1.6pt)[MANUAL DE REGLAS]
  v(0.14cm)
  text(size: 11pt, fill: c.gray)[v1.0]
  v(0.85cm)
  image("../.generated/pdf/assets/manual/night_city.png", width: 78%)
}

#let toc-entry(h) = context {
  let page-num = locate(h.location()).page()
  let size = 11pt
  let level-minus-one = h.level - 1
  let indent = level-minus-one * 6pt
  pad(
    bottom: 7.8pt,
    grid(
      columns: (auto, auto, 1fr, auto),
      column-gutter: (0pt, 5pt, 5pt),
      box(width: indent)[],
      text(size: size, h.body),
      text(size: size, fill: c.gray)[#repeat[.]],
      text(size: size, str(page-num)),
    ),
  )
}

#let toc-columns() = context {
  let entries = query(heading.where(outlined: true)).filter(h => h.level <= 3)
  let items = entries.map(h => toc-entry(h))
  let half = calc.floor(items.len() / 2)
  pad(top: 14pt, grid(
    columns: (1fr, 1fr),
    column-gutter: 22pt,
    stack(spacing: 0pt, ..items.slice(0, half)),
    stack(spacing: 0pt, ..items.slice(half)),
  ))
}

#let chapter-block(body) = {
  pagebreak(weak: true)
  set par(leading: 7.8pt, spacing: 14pt)
  columns(2, gutter: 20pt, body)
}

#let manual(body) = {
  set text(font: ("VT323", "Menlo", "Apple Symbols"), size: 11pt, fill: c.text, lang: "es", hyphenate: false)
  set page(paper: "a4", margin: (top: 1.5cm, bottom: 1.55cm, x: 1.35cm), numbering: none, footer: context {
    let p = counter(page).get().first()
    if p > 1 {
      align(center, text(fill: c.gray, size: 11pt)[-- #counter(page).display("1") --])
    }
  })
  set par(leading: 0.24em, spacing: 0.8em, justify: false)
  set list(marker: text(fill: c.black)[»], indent: 1.1em, body-indent: 0.75em, spacing: 0.7em, tight: false)
  set enum(numbering: (..n) => text(fill: c.black)[» ], indent: 1.1em, body-indent: 0.75em, spacing: 0.7em, tight: false)

  show heading.where(level: 1): it => {
    block(sticky: true, breakable: false, width: 100%)[
      #align(center)[#h-rule#linebreak()#text(size: 14pt, fill: c.black, it.body)#linebreak()#h-rule]
    ]
  }
  show heading.where(level: 2): it => block(sticky: true, breakable: false, above: 14pt, below: 14pt, width: 100%, text(size: 14pt, fill: c.black, it.body))
  show heading.where(level: 3): it => block(sticky: true, breakable: false, above: 12pt, below: 12pt, width: 100%, text(size: 14pt, fill: c.gray, it.body))
  show heading.where(level: 4): it => block(sticky: true, breakable: false, above: 10pt, below: 10pt, width: 100%, text(size: 14pt, fill: c.black, it.body))

  cover-page()
  pagebreak()
  heading(level: 1, outlined: false)[Índice]
  toc-columns()
  body
}

#let fig-float(path, width: 100%) = place(bottom + center, float: true, scope: "column", clearance: 6pt, image(path, width: width))

#let banner(path, width: 85%) = block(above: 4pt, below: 8pt, width: 100%, align(center, image(path, width: width)))

#let fig(path, width: 100%) = block(above: 10pt, below: 10pt, width: 100%, align(center, image(path, width: width)))

#let figrow(paths, frs) = block(above: 10pt, below: 10pt, width: 100%, grid(columns: frs, column-gutter: 6pt, ..paths.map(p => image(p, width: 100%))))

#let tbl(head, rows, cols: auto) = {
  let num-cols = head.len()
  let cols = if cols != auto { cols } else if num-cols == 3 { ((7fr, 18fr, 25fr)) } else if num-cols == 2 { ((2fr, 3fr)) } else { (..range(num-cols).map(_ => 1fr)) }
  block(above: 10pt, below: 11pt, grid(
    columns: 1,
    rows: (auto, auto),
    block(
      fill: c.th-bg,
      inset: (x: 5pt, y: 3.5pt),
      grid(columns: cols, ..head.map(h => text(fill: c.th-fg, h))),
    ),
    table(
      columns: cols,
      inset: (x: 5pt, y: 3.5pt),
      stroke: (top: none, x: none, left: none, right: none, y: 0.6pt + c.line, bottom: 0.6pt + c.line),
      ..rows.flatten(),
    ),
  ))
}

#let quote(body) = block(width: 100%, above: 10pt, below: 10pt, stroke: (left: 2.5pt + c.soft), inset: (left: 8pt, top: 1pt, bottom: 1pt, right: 4pt), text(fill: c.soft, body))

#let ejemplo(body) = block(width: 100%, above: 10pt, below: 10pt, stroke: (left: 2.5pt + c.gray), inset: (left: 8pt, top: 1pt, bottom: 1pt, right: 4pt), text(fill: c.gray, body))

#let mesa(body) = text(fill: c.soft, body)

#let legal(body) = text(size: 8.5pt, fill: c.muted, body)

#let sep() = block(above: 14pt, below: 14pt, width: 100%, align(center, text(fill: c.gray)[----------------------------]))

#let acc(body) = text(fill: c.black, body)
#let emc(body) = text(fill: c.soft, body)
#let hl(body) = text(fill: c.soft, body)
#let mono(body) = text(fill: c.black, body)