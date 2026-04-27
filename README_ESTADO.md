# Caidas Mayores - Bitacora viva

## Uso de este archivo

Este archivo funciona como memoria operativa del proyecto.

No busca documentar todo en detalle, sino registrar:

- incidencias importantes
- avances relevantes
- estado actual por dispositivo
- proximo paso sugerido

Cada vez que haya un cambio importante, conviene agregar una entrada breve con:

- fecha
- dispositivo
- modulo
- que paso
- que se hizo
- estado actual

## Estado actual rapido

### Mac / notebook

- La app funciona localmente.
- Monopedia mejoro en el inicio del test.
- El cierre del test sigue sensible: en una prueba hubo que bajar el pie dos veces.
- La busqueda de pacientes paso a ser prioridad funcional.
- Ya existe boton `Guardar ficha` para asegurar que el paciente quede disponible en busqueda e historial.

### Celular

- La carga de fecha era incomoda y se corrigio con autoformato.
- El panel lateral era molesto en pantalla chica y se ajusto para colapso en vista compacta.
- Falta revalidar en uso real la fecha y la deteccion de monopedia.

## Incidencias

### 2026-04-21 | Celular | Fecha de nacimiento

- Problema: el teclado numerico no permitia escribir `/`, por lo que cargar la fecha era muy molesto.
- Accion: se dejo el campo para entrada numerica con autoformato `dd/mm/aaaa`.
- Estado: corregido en codigo, pendiente validar en uso real.
- Archivos:
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/index.html`
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/js/app.js`

### 2026-04-21 | Mac | Monopedia - inicio del test

- Problema: quedaba en `Preparando...`, no siempre llegaba a `Listo` o no disparaba el cronometro.
- Accion: se aflojaron thresholds de quietud e inicio y se mejoraron mensajes de fase.
- Estado: mejorado.
- Archivos:
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/js/app.js`

### 2026-04-21 | Mac | Monopedia - cierre del test

- Problema: detecta mejor la elevacion, pero en una prueba hubo que bajar el pie dos veces para cerrar.
- Accion: se aflojo la condicion de cierre, incluyendo `FRAMES_FIN` y el retorno dinamico del pie activo.
- Estado: mejorado, pero no cerrado. Requiere otra validacion.
- Archivos:
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/js/app.js`

### 2026-04-21 | Mac y celular | Busqueda de pacientes

- Problema: la busqueda no devolvia resultados de forma confiable y la ficha no siempre quedaba disponible para comparacion.
- Accion: se agrego `Guardar ficha`, aviso de ficha sin guardar, confirmacion al cambiar de paciente y busqueda por tokens mas flexible.
- Estado: mejorado en codigo, pendiente validar con uso real.
- Archivos:
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/index.html`
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/js/app.js`
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/css/styles.css`

### 2026-04-21 | General | Riesgo de perder contexto del chat

- Problema: el historial de conversacion contiene razonamientos, errores y decisiones que no conviene perder.
- Accion: se creo esta bitacora local para no depender solo del chat.
- Estado: resuelto parcialmente. El chat sigue siendo util, pero lo importante ya puede registrarse aca.

### 2026-04-23 | Celular | Monopedia online

- Problema: habia duda sobre si los cambios locales llegaban realmente a GitHub, Vercel y celular.
- Accion: se valido el flujo completo editando, commiteando, haciendo push y viendo un cambio minimo en el celular.
- Estado: resuelto. El circuito local -> GitHub -> Vercel -> celular funciona.
- Nota: para futuros cambios, trabajar en el clon y usar terminal para Git.
- Carpeta de trabajo:
  - `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/caidas-mayores-prototipo`

### 2026-04-23 | Celular | Monopedia - prueba funcional

- Problema: se necesitaba confirmar si monopedia ya estaba usable online en celular.
- Accion: se probo la version publicada.
- Estado: parece funcionar correctamente en una prueba inicial.
- Pendiente: seguir observando si el cierre detecta la bajada del pie con una sola accion.

### 2026-04-23 | Sit to Stand | Validacion pendiente

- Problema: el sistema muestra encuadre completo aunque el sujeto no este completamente en plano, puede ponerse verde con detecciones parciales y el cronometro no dispara.
- Observacion: el overlay acompana el movimiento, lo que indica que hay landmarks, pero la maquina de estados no llega a iniciar ni contar.
- Estado: mas inmaduro que monopedia. Requiere rediseño de estados y validacion especifica, sin afectar monopedia.
- Riesgo: no conviene agregar controles manuales tipo `+1 repeticion`, porque obliga al operador a controlar al paciente y al sistema al mismo tiempo.

## Avances

### 2026-04-21 | Pacientes

- Importacion CSV mejorada para distinguir pacientes vs resultados.
- Soporte para edad importada cuando no hay fecha valida.
- Historial por paciente visible en interfaz.
- Riesgo global orientativo calculado a partir de tests guardados.

### 2026-04-21 | UX del test

- Mensajes de fase agregados:
  - `Preparando...`
  - `Quédese quieto`
  - `Listo, levante un pie`
  - `Test en curso... baje el pie para finalizar.`
- Boton `Ver informe completo` disponible cuando hay resumen.

### 2026-04-21 | Flujo de ficha

- Se puede guardar la ficha antes del test.
- La interfaz avisa cuando la ficha todavia no esta guardada.
- Al cambiar de paciente con ficha valida sin guardar, pregunta si se desea guardar antes.

### 2026-04-23 | Flujo Git / publicacion

- Se clono el repositorio de GitHub dentro de una carpeta local conectada.
- Se valido `git push origin main` desde terminal.
- Recomendacion operativa:
  - editar en VS Code
  - usar terminal para `git status`, `git add`, `git commit` y `git push`
- Evitar volver al copy-paste manual en GitHub web.

## Estado por modulo

### Pacientes

- Carga manual: funcional
- Guardado explicito: funcional
- Busqueda: mejorada, pendiente validar
- Historial: funcional

### Monopedia

- Preparacion: funcional
- Inicio automatico: mejorado
- Cierre automatico: todavia sensible
- Informe final: funcional
- Proximo ajuste clinico: agregar `Pierna de apoyo` con opciones `Derecha` / `Izquierda`, sin deteccion automatica del lado.
- Justificacion: la comparacion clinica debe hacerse por pierna de apoyo, especialmente en casos de dolor unilateral como gonalgia.

### Sit to Stand

- Estado actual: no confiable para uso clinico.
- Problemas observados:
  - encuadre completo falso
  - falsos positivos con detecciones parciales
  - cronometro no dispara
  - contador/overlay se mueve pero no cuenta
- Requiere cambios especificos y separados de monopedia.

### Video de caidas

- Modulo beta funcional
- No es prioridad inmediata frente a pacientes y monopedia

## Proximo paso sugerido

### Prioridad 1

Validar en Mac si:

- la ficha guardada aparece facil en busqueda
- el test de monopedia cierra con una sola bajada del pie

Agregar a monopedia:

- selector `Pierna de apoyo`
- opciones `Derecha` / `Izquierda`
- guardar ese dato en el resultado
- mostrarlo en el informe e historial

### Prioridad 2

Revalidar en celular:

- carga de fecha
- uso del panel lateral
- comportamiento basico de monopedia

### Prioridad 3

Si monopedia sigue cerrando tarde, revisar solo esta parte:

- `UMBRAL_FIN`
- `FRAMES_FIN`
- `UMBRAL_DIFERENCIA_PIES_FIN`
- retorno dinamico del pie activo

Archivo principal a revisar:

- `/Users/juancarlosgallo/Documents/caidas-mayores-prototipo/js/app.js`

### Idea posterior: resumen simple del paciente

No crear todavia una estructura compleja de episodios/evaluaciones.

Primera version recomendada:

- seguir guardando cada prueba individual
- agregar `ladoApoyo` en monopedia
- mejorar historial con ultimos estudios por fecha, prueba, lado, tiempo y resultado
- agregar resumen simple:
  - ultima prueba
  - peor resultado reciente
  - comparacion derecha/izquierda si hay ambas piernas
  - alerta de asimetria si una pierna esta roja y otra verde

## Plantilla para nuevas entradas

Copiar y completar:

```md
### AAAA-MM-DD | Dispositivo | Modulo

- Problema:
- Accion:
- Estado:
- Archivos:
  - `/ruta/al/archivo`
```
