import { encode } from 'uqr'
import { getCategory } from '../data/categories.js'
import { formatLongDate, formatTime, isMultiDay } from './dates.js'
import { imageUrl } from './events.js'

/** Loads an event photo and converts it to JPEG so jsPDF can embed it. */
async function photoAsJpeg(event) {
  const img = new Image()
  img.src = imageUrl(event, 'sm')
  await img.decode()
  const canvas = Object.assign(document.createElement('canvas'), { width: 800, height: 500 })
  canvas.getContext('2d').drawImage(img, 0, 0, 800, 500)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Builds a printable A5 ticket PDF: photo, event details, attendee and a scannable QR code
 * on a coloured stub. jsPDF is loaded only when someone actually downloads a ticket.
 */
export async function downloadTicketPdf(event, registration) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' }) // 210 x 148
  const ink = '#17143a'
  const stubX = 152
  const category = getCategory(event.category)

  // Ticket body and stub
  pdf.setFillColor('#ffffff')
  pdf.rect(0, 0, 210, 148, 'F')
  pdf.setFillColor(category.color)
  pdf.rect(stubX, 0, 58, 148, 'F')
  // Perforation
  pdf.setFillColor('#ffffff')
  for (let y = 4; y < 148; y += 5) pdf.circle(stubX, y, 0.9, 'F')

  try {
    pdf.addImage(await photoAsJpeg(event), 'JPEG', 10, 10, 132, 55)
  } catch {
    /* the ticket still works without the photo */
  }

  pdf.setTextColor(ink)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`${category.label.toUpperCase()}  /  ${event.city.toUpperCase()}`, 10, 74)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text(pdf.splitTextToSize(event.title, 132), 10, 84)

  const when = isMultiDay(event.start, event.end)
    ? `${formatLongDate(event.start)} to ${formatLongDate(event.end)}`
    : `${formatLongDate(event.start)}, ${formatTime(event.start)} to ${formatTime(event.end)}`

  const rows = [
    ['When', when],
    ['Where', `${event.venue}, ${event.address}`],
    ['Name', registration.name],
    ['Seats', `${registration.seats}  (${event.price ? `Rs. ${(event.price * registration.seats).toLocaleString('en-IN')}, paid at the venue` : 'Free entry'})`],
  ]
  let y = 98
  for (const [label, value] of rows) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor('#5b5876')
    pdf.text(label, 10, y)
    pdf.setFontSize(10)
    pdf.setTextColor(ink)
    const lines = pdf.splitTextToSize(value, 112)
    pdf.text(lines, 30, y)
    y += 5 + lines.length * 4.4
  }

  // Stub: QR code drawn module by module so it stays sharp at any zoom.
  const { data, size } = encode(registration.id, { ecc: 'M', border: 0 })
  const qr = 40
  const cell = qr / size
  const qx = stubX + 9
  const qy = 20
  pdf.setFillColor('#ffffff')
  pdf.roundedRect(qx - 3, qy - 3, qr + 6, qr + 6, 2, 2, 'F')
  pdf.setFillColor(ink)
  data.forEach((row, r) => row.forEach((on, c) => on && pdf.rect(qx + c * cell, qy + r * cell, cell + 0.02, cell + 0.02, 'F')))

  pdf.setTextColor(ink)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(registration.id, stubX + 29, 74, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`Admit ${registration.seats}`, stubX + 29, 80, { align: 'center' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(30)
  pdf.text(formatLongDate(event.start).split(' ')[1], stubX + 29, 112, { align: 'center' })
  pdf.setFontSize(10)
  pdf.text(formatLongDate(event.start).split(' ').slice(2).join(' '), stubX + 29, 119, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('mela', stubX + 29, 140, { align: 'center' })

  pdf.setTextColor('#5b5876')
  pdf.text('Show this ticket at the entrance. Saved from mela on this device.', 10, 140)

  pdf.save(`${event.slug}-${registration.id}.pdf`)
}
