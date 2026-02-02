### 1. Коллекция: `projects` (Проекты)
*Корневая сущность системы.*

| Поле | Тип | Настройки | Описание |
| :--- | :--- | :--- | :--- |
| `name` | Plain Text | **Nonempty**, **Presentable** | Название проекта |
| `key` | Plain Text | **Nonempty**, **Unique**, **Max 10** | Короткий ключ (напр. IOS, WEB) |
| `description` | Plain Text | - | Описание проекта |
| `gitea_url` | URL | - | Базовый URL Gitea |
| `gitea_owner` | Plain Text | - | Владелец/Организация в Gitea |
| `gitea_repo` | Plain Text | - | Название репозитория |

---

### 2. Коллекция: `suites` (Папки)
*Поддерживает бесконечную вложенность.*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `name` | Plain Text | - | **Nonempty**, **Presentable** |
| `project_id` | Relation | `projects` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `parent_id` | Relation | `suites` | **Single**, **Cascade Delete: True** |

---

### 3. Коллекция: `cases` (Тест-кейсы)
*Основная библиотека тестов.*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `title` | Plain Text | - | **Nonempty**, **Presentable** |
| `project_id` | Relation | `projects` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `suite_id` | Relation | `suites` | **Single**, **Cascade Delete: True** |
| `priority` | Select | - | low, medium, high, critical (Nonempty) |
| `automation_status` | Select | - | manual, automated, to_automate (Nonempty) |
| `pre_condition` | Text | - | Текст предусловий |
| `steps` | JSON | - | Массив объектов `[{action, expected}]` |
| `post_condition`| Text | - | Текст постусловий (Cleanup) |

---

### 4. Коллекция: `case_history` (История изменений)
*Логи версионности для отката изменений.*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `case_id` | Relation | `cases` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `user_id` | Relation | `users` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `type` | Select | - | created, updated, restored |
| `data` | JSON | - | Снимок полей кейса на момент сохранения |

---

### 5. Коллекция: `test_plans` (Планы)
*Шаблоны для повторных запусков (Регресс, Смоук).*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `name` | Plain Text | - | **Nonempty**, **Presentable** |
| `description` | Plain Text | - | Описание плана |
| `project_id` | Relation | `projects` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `case_ids` | Relation | `cases` | **Multiple**, **Cascade Delete: False** (важно) |

---

### 6. Коллекция: `runs` (Прогоны)
*Запуск тестирования "здесь и сейчас".*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `title` | Plain Text | - | **Nonempty**, **Presentable** |
| `project_id` | Relation | `projects` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `status` | Select | - | active, finished (Nonempty) |
| `environment` | Plain Text | - | Напр: Production, Staging |
| `finishDuration` | **Number** | - | Длительность прогона в минутах |

---

### 7. Коллекция: `run_results` (Результаты)
*Детальная история прохождения каждого кейса в рамках прогона.*

| Поле | Тип | Связь с коллекцией | Настройки |
| :--- | :--- | :--- | :--- |
| `run_id` | Relation | `runs` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `case_id` | Relation | `cases` | **Single**, **Nonempty**, **Cascade Delete: True** |
| `status` | Select | - | untest, passed, failed, skipped (Nonempty) |
| `comment` | Text | - | Комментарий тестера |
| `attachments` | **File** | - | **Multiple**, Max 5MB, images only |
| `issue_url` | Text | - | Ссылка (или несколько через пробел) на баг в Gitea |
| `snapshotted_data`| JSON | - | Снимок данных кейса на момент старта |
| `failed_steps` | JSON | - | Шаги которые были отмечены как failed |

---