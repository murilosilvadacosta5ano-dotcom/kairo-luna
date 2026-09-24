# Kairo 6 Luna

Chat em estilo iOS (réplica visual do ChatGPT) com **Google Gemini**.

- Conversas com histórico, busca e modelos Luna / Rápido
- Criar imagens, câmera, fotos e pesquisa na web
- A chave da API Gemini fica só no aparelho (Ajustes)

## Como usar

1. Abra **Ajustes** (menu → ícone de sliders) ou toque em **Conectar Gemini**
2. Cole uma chave do [Google AI Studio](https://aistudio.google.com/apikey)
3. Salve e envie uma mensagem

**Luna** usa Gemini 2.5 Pro. **Rápido** usa Gemini 2.5 Flash.

## Desenvolvimento

```bash
npm install
npm run dev
```

```bash
npm run build
```

A chave Gemini **não** vai no repositório. Cada pessoa cola a própria chave no app.
