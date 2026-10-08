#import "theme.typ": c, ascii-logo

#set page(paper: "a4", margin: (x: 0.85cm, top: 0.9cm, bottom: 0.7cm))
#set text(font: ("VT323", "Menlo", "Apple Symbols"), size: 10pt, fill: c.text, lang: "es")

#let pitch = 17pt
#let gh(n) = text(fill: c.ghost, "_" * n)
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

#let photo() = box(
  width: 6.4em,
  height: 119pt,
  stroke: 1pt + c.black,
  inset: 0pt,
  align(center + horizon, text(fill: c.muted, size: 9pt)[FOTO]),
)

#let rows-grid(heights, ..cells) = grid(
  columns: 1,
  row-gutter: 0pt,
  rows: (..heights),
  ..cells,
)

#let ledger-col(title, width, unders, rows) = rows-grid(
  (17pt, 12pt, ..range(rows).map(_ => pitch)),
  col-title(title, width),
  [],
  ..range(rows).map(_ => text(fill: c.ghost, "|" + ("_" * unders) + "|")),
)

#let col1 = grid(
  columns: 1,
  row-gutter: 5pt,
  ascii-logo(size: 11pt),
  rows-grid(
    (
      17pt, 17pt, 17pt, 17pt, 17pt, 119pt, 17pt, 17pt, 17pt, 17pt, 17pt,
      17pt, 17pt, 17pt, 17pt, 17pt, 17pt, 17pt, 17pt,
    ),
    [Nombre:> #gh(33)],
    [Jugador:> #gh(33)],
    [Profesión:> #gh(31)],
    [\@Psique:> #gh(7)#boxw()#boxw()#boxw()#boxws()#boxws()],
    [],
    photo(),
    [],
    [Atributos:>  Enlaces Neuronales#gh(5) #stat()],
    [             Manipulación Cognitiva#gh(1) #stat()],
    [             Reacción Cinética#gh(6) #stat()],
    [             Tejido Muscular#gh(8) #stat()],
    [],
    [Salud:>          Normal -> #boxt()#boxt()#boxt()#boxt()#boxt()],
    [                     -1 -> #boxts()#boxt()#boxt()#boxt()],
    [                     -2 -> #boxts()#boxt()#boxt()#boxt()],
    [                     -3 -> #boxts()#boxt()#boxt()#boxt()],
    [          Falla Integral -> #boxts()#boxt()],
    [],
    [Experiencia:> #gh(28)],
  ),
)

#grid(
  columns: (16.8em, 16.8em, 16.4em),
  column-gutter: 20pt,
  col1,
  ledger-col("Cromos", 42, 40, 31),
  ledger-col("Chapería", 41, 39, 31),
)
