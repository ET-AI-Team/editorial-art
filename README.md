# editorial-art

The backend service behind **ET Articles** in AI Studio. An editor pastes an article, optionally adds a prompt, and either lets the story suggest three visual directions or picks one of 33 ET house styles, each learned from published work by real artists. They get four preview illustrations within about a minute, can ask for more or try another style, and then download a publish-ready pack: 16:9 hero, 1:1, 1.91:1 and 9:16, with alt text, a caption and a credit line.

- **Plan:** [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- **Styles:** [docs/STYLE_LIBRARY.md](docs/STYLE_LIBRARY.md)
- **Stack:** Bun, Express, Socket.IO, BullMQ, Prisma (Postgres with pgvector), Redis, Cloudinary
- **Models:** gpt-4.1 (reading, judging), gemini-3.1-flash-image (previews), gemini-3-pro-image (finals, size extension), gpt-image-2 (fallback)
- **Callers:** only the AI Studio API, over loopback, with an internal API key

Status: plan stage. Build starts after the plan is approved.
