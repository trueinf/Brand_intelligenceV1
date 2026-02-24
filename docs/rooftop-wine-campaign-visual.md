# Rooftop Wine Tasting Campaign Visual

Luxury rooftop sunset wine tasting campaign for affluent young professionals. Use the prompt with DALL·E 3, or call `POST /api/generate-rooftop-wine-visual` to generate and store the image.

---

## Creative brief

| Dimension | Spec |
|-----------|------|
| **Scene** | Rooftop terrace, golden hour, wine tasting |
| **Lighting** | Golden hour, warm rim light, city lights in bokeh |
| **Style** | Elegant fashion, city skyline bokeh, magazine-quality |
| **Composition** | Wine bottle hero in foreground; lifestyle interaction (people) in mid-ground |
| **Emotion** | Celebration, exclusivity, social belonging |
| **Copy space** | Top: event title. Bottom: date + reservation CTA |
| **Quality** | Magazine-quality photography |

---

## Image generation prompt (DALL·E 3 / generic)

```
Magazine-quality professional photography, luxury lifestyle. Rooftop terrace at golden hour, sunset light, city skyline in soft bokeh background. Wine bottle as hero in the foreground, elegant bottle and glass, shallow depth of field. Mid-ground: affluent young professionals in elegant fashion, refined casual luxury, wine tasting moment, celebration and connection, sense of exclusivity and social belonging. Golden hour lighting, warm rim light on the bottle and skin tones, city lights beginning to glow in the bokeh. Emotion: celebration, exclusivity, belonging. Composition: bottle dominant in lower third; people and skyline behind; clear negative space at the very top for event title; clear negative space at the very bottom for date and reservation CTA. Editorial magazine quality, high-end advertising, realistic photography, shallow depth of field, 85mm lens. Global brand advertising style, award-winning campaign visual. No distorted anatomy, no extra products, no text artifacts, no watermark.
```

---

## Suggested copy

- **Top (event title):** *Skyline Reserve*
- **Bottom (date + CTA):** *June 22 · Reserve your place*

---

## API

```bash
curl -X POST http://localhost:3000/api/generate-rooftop-wine-visual
```

Response:

```json
{
  "url": "/creatives/rooftop-wine-campaign-xxx.png",
  "eventTitle": "Skyline Reserve",
  "dateCta": "June 22 · Reserve your place"
}
```

Image is generated in portrait (1024×1536) to maximize top and bottom copy space.
