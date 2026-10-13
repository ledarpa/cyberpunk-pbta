#import "theme.typ": c, ascii-logo

#set page(paper: "a4", margin: (x: 0.55cm, top: 0.45cm, bottom: 0.5cm))
#set text(font: ("VT323", "Menlo", "Apple Symbols"), size: 16pt, fill: c.text, lang: "es")
#set par(leading: 0pt, spacing: 0pt, justify: false)

#let pitch = 16pt
#let gh(n) = text(fill: c.ghost, "_" * n)
#let dots(n) = text(fill: c.ghost, "." * n)
#let inv(n) = text(fill: white, "." * n)
#let stat() = text(fill: c.black, "[  ]")
#let boxt() = text(fill: c.black, "[ ]")
#let boxts() = text(fill: c.black)[#("[")#text(fill: c.muted, "*")#("]")]
#let boxw() = text(fill: c.black, "[   ]")
#let boxws() = text(fill: c.black)[#("[ ")#text(fill: c.muted, "*")#(" ]")]

#let col-title(label, width) = {
  let inner = " " + label + " "
  let room = width - 2 - inner.len()
  let l = calc.floor(room / 2)
  let r = room - l
  text(fill: c.black, "[" + ("·" * l) + inner + ("·" * r) + "]")
}

#let rows-grid(heights, ..cells) = grid(
  columns: 1,
  row-gutter: 0pt,
  rows: (..heights),
  ..cells,
)

#let ledger-col(title, width, unders, rows) = rows-grid(
  (pitch, pitch, ..range(rows).map(_ => pitch)),
  col-title(title, width),
  [],
  ..range(rows).map(_ => text(fill: c.ghost, "|" + ("_" * unders) + "|")),
)

#let L(body) = block(height: pitch, body)

// LOGO (25% más chico que la portada, centrado)
#align(center)[#ascii-logo(size: 9pt)]

#v(16pt)

// IDENTIDAD (izq, margen izquierdo) | ATRIBUTOS (der, margen derecho)
#block(width: 100%)[
  #grid(
    columns: (1fr, auto),
    column-gutter: 14pt,
    // Columna 1: identidad (ocupa el resto, contenido a la izquierda)
    grid(
      columns: 1,
      row-gutter: 0pt,
      rows: (pitch, pitch, pitch, pitch),
      L[Nombre:\>#dots(26)],
      L[Jugador:\>#dots(25)],
      L[Profesión:\>#dots(23)],
      L[\@Psique#text(fill: c.ghost)[.]#boxw()#boxw()#boxw()#boxws()#boxws()#text(fill: c.ghost)[.]],
    ),
    // Columna 2: atributos (auto, empujada al margen derecho por el 1fr)
    grid(
      columns: 1,
      row-gutter: 0pt,
      rows: (pitch, pitch, pitch, pitch),
      L[Enlaces Neuronales#dots(5) #stat()],
      L[Manipulación Cognitiva#dots(1) #stat()],
      L[Reacción Cinética#dots(6) #stat()],
      L[Tejido Muscular#dots(8) #stat()],
    ),
  )
]

#v(pitch)

// SALUD
#grid(
  columns: 1,
  row-gutter: 0pt,
  rows: (pitch, pitch, pitch),
  L[#inv(77)#text(fill: c.gray)[Falla]],
  L[#inv(26)#text(fill: c.gray)[-1]#inv(15)#text(fill: c.gray)[-2]#inv(15)#text(fill: c.gray)[-3]#inv(15)#text(fill: c.gray)[integral]],
  L[Salud:\>#dots(2)#boxt()#boxt()#boxt()#boxt()#boxt()#dots(2)#boxts()#boxt()#boxt()#boxt()#boxt()#dots(2)#boxts()#boxt()#boxt()#boxt()#boxt()#dots(2)#boxts()#boxt()#boxt()#boxt()#boxt()#dots(2)#boxts()#boxt()#boxt()#dots(2)],
)

#v(8pt)

// CROMOS (izq) | CHAPERÍA (der)
#grid(
  columns: (1fr, 1fr),
  column-gutter: 14pt,
  ledger-col("Cromos", 40, 38, 33),
  ledger-col("Chapería", 40, 38, 33),
)

#v(8pt)

// EXPERIENCIA
#grid(
  columns: 1,
  row-gutter: 0pt,
  rows: (pitch,),
  L[Experiencia:#gh(76)],
)
