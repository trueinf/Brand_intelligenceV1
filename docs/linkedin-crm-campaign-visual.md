# LinkedIn Campaign Visual — AI-Powered CRM Platform

High-end B2B campaign visual for LinkedIn. Use the prompt with DALL·E 3, or call `POST /api/generate-linkedin-crm-visual` to generate and store the image.

---

## Creative brief

| Dimension | Spec |
|-----------|------|
| **Scene** | Modern glass boardroom at sunset, diverse executive sales team reviewing growth projections on a large screen |
| **Mood** | Cinematic, premium, intelligent, confident |
| **Audience** | B2B sales leaders and SaaS decision-makers |
| **Composition** | Product UI subtly visible on central screen; people in triangular leadership formation |
| **Lighting** | Cool blue + warm edge light (innovation feel) |
| **Copy space** | Top-left: headline. Bottom-right: CTA |
| **Style** | Corporate luxury, realistic photography, shallow DoF, 85mm lens |

---

## Image generation prompt (DALL·E 3 / generic)

```
Professional commercial photography, corporate luxury, cinematic mood. Modern glass boardroom at sunset, floor-to-ceiling windows with golden hour light. Diverse executive sales team in a triangular leadership formation: three to four professionals in tailored business attire, confident poses, reviewing growth projections on a large central screen. The screen displays a subtle, premium SaaS product UI (CRM dashboard with charts and metrics), soft glow, not dominant. Shallow depth of field, 85mm lens, shot on medium format. Lighting: cool blue fill from the windows and screens, warm edge light and rim light on the subjects for an innovation-meets-confidence feel. Mood: intelligent, premium, confident, B2B. Composition: people form a triangle with the screen as focal point; clear negative space in the top-left for headline text; clear negative space in the bottom-right for CTA. Realistic photography, editorial magazine quality, high dynamic range, ultra realistic textures. Global brand advertising style, award-winning campaign visual. No distorted anatomy, no extra products, no text artifacts, no watermark.
```

---

## Suggested copy

- **Headline (top-left):** *Where sales leaders see what's next.*
- **CTA (bottom-right):** *See the platform*

---

## API

**Generate image and get URL:**

```bash
curl -X POST http://localhost:3000/api/generate-linkedin-crm-visual
```

Response:

```json
{
  "url": "/creatives/linkedin-crm-campaign-xxx.png",
  "headline": "Where sales leaders see what's next.",
  "cta": "See the platform"
}
```

Image is saved to `public/creatives/` and returned as a path (e.g. use `https://your-domain.com/creatives/...` for LinkedIn).

---

## LinkedIn specs

- **Single image post:** 1200×627 (landscape) or 1080×1080 (square)
- **Document / hero:** 1536×1024 is generated; crop to 1200×627 if needed for link preview
