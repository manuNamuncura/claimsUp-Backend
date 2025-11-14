# Guía de comandos en `.cursor/commands`

Explicación breve de cada comando disponible para orquestar y documentar el flujo de trabajo.

- **analyze.md**: Analiza una especificación técnica; identifica riesgos (técnicos, alcance, dependencias) y formula preguntas de clarificación.
- **architect.md**: Solución de arquitectura; desde el PRD propone mitigaciones y genera `docs/architecture_decisions.md`.
- **brainstorm.md**: Sesión de ideación guiada; crea `docs/OVERVIEW.md`, `docs/REQUIREMENTS.md`, `docs/PLAN.md`.
- **clarify.md**: Entrevista de requisitos (rol PM) y síntesis en `docs/clarification_notes.md`.
- **commit.md**: Genera mensajes de commit conforme a Conventional Commits.
- **debug.md**: Análisis de causa raíz para tareas fallidas; devuelve JSON con `root_cause` y `recommendation`.
- **decompose.md**: Construye `docs/tasks.json` con tareas secuenciadas y dependencias a partir de PRD y arquitectura.
- **detail.md**: Crea `docs/DETAILED_IMPLEMENT.md` con pasos atómicos numerados (objetivo, prompt, output, tests, deps).
- **document.md**: Añade docstrings/JSDoc e inserta comentarios en código no trivial.
- **feature.md**: Orquesta el ciclo de una feature (clarify → plan → ejecución → finalización) manteniendo `active_context.md` y `tasks.json`.
- **finalization.md**: Cierre; resume sesión (/save_context), genera commit (/commit) y actualiza `active_context.md`.
- **fix.md**: Flujo de remediación tras verificación fallida: usa `/debug`, replantea con `/decompose` y actualiza `docs/tasks.json`.
- **mermaid.md**: Genera diagramas en `docs/diagrams/*` (arquitectura, data-flow, sequence, interacción, estado) y su README.
- **mvp.md**: Define `docs/MVP.md` con objetivo, core features, restricciones relajadas, UI mínima, testing y despliegue rápido.
- **orchestator.md**: Orquestador GENESIS; asegura protocolo, separación de responsabilidades y gate de aprobación.
- **plan-tasks.md**: Planificador estratégico que produce `docs/tasks.json` integrando calidad (refine/secure/tests).
- **plan.md**: Genera `IMPLEMENT.md` con arquitectura técnica, setup, organización, API, testing y despliegue.
- **prd.md**: Transforma `docs/clarification_notes.md` en `docs/prd.md` con estructura PRD.
- **prepare.md**: Workflow de 5 pasos (/brainstorm → /plan → /mvp → /detail → /mermaid) con quality gates y feedback.
- **refine.md**: Refina código (nombres claros, simplificación, mejores prácticas, formato).
- **review.md**: Revisor automático; checklist de claridad, simplicidad, consistencia, errores y buenas prácticas.
- **save.md**: Define guardado de contexto/ejecución en `docs/execution.md` y lineamientos de commits y estatus de tareas.
- **spec.md**: Convierte una solicitud en especificación técnica con objetivo, I/O, lógica, criterios de aceptación y archivos.
- **task_executor.md**: Ejecuta una tarea de `tasks.json` respetando criterios de aceptación; auto-refina y documenta antes de finalizar.
- **verify-task.md**: QA automático; verifica tareas `ready-for-verification` y marca done/failure con notas.

## Archivos clave que interactúan

- `docs/active_context.md`: Memoria viva del proyecto (siempre leer primero y actualizar al final).
- `docs/tasks.json`: Plan de ejecución con el estado de las tareas.
- `docs/clarification_notes.md`, `docs/prd.md`, `docs/architecture_decisions.md`: Base de requisitos y decisiones.
