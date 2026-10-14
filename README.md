# naos
## Radar · alertas

`radar/alerta.py` revisa cada ~5 min (GitHub Actions, `.github/workflows/alerta.yml`) cripto, índices (US500, US100, IWM, Nikkei), metales, energía y las acciones que aparecen en los titulares, con la API pública de OKX. Cuando algo se mueve fuera de lo normal en 1 h, 4 h o 24 h deja un post en plantilla y un gráfico en `radar/alertas/` y abre un issue. Precios de perpetuos de OKX como aproximación del subyacente. Descriptivo, no es asesoría financiera.
