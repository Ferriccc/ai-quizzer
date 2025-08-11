## Quiz Management

### `POST /quizzes`

**Description:**
Generates a new quiz using AI, based on provided data (including grade level, subject, number of questions).

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**

```json
{
    "grade": 5,
    "Subject": "Maths",
    "TotalQuestions": 10,
    "MaxScore": 10,
    "Difficulty": "EASY|MEDIUM|HARD"
}
```

**Response (201 Created):**

```json
{
  "quizId": "12345",
  "gradeLevel": 8,
  "subject": "Mathematics",
  "questions": [
    {
      "id": "q1",
      "question": "What is 12 × 8?",
      "options": ["80", "92", "96", "108"],
      "difficulty": "MEDIUM"
    }
  ]
}
```

**Expected Behavior:**

* Use AI to generate quiz questions with difficulty adjusted to grade level.
* Store quiz in the database.
* Return quiz ID and generated questions.

---

### `POST /quizzes/{quizId}/submit`

**Description:**
Submits answers for evaluation. Returns score and AI-generated improvement tips.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**

```json
{
  "answers": [
    {"questionId": "q1", "answer": "96"},
    {"questionId": "q2", "answer": "Paris"}
  ]
}
```

**Response (200 OK):**

```json
{
  "quizId": "12345",
  "score": 8,
  "total": 10,
  "improvementTips": [
    "Review multiplication tables up to 12.",
    "Revise European capitals."
  ]
}
```

**Expected Behavior:**

* Evaluate answers using AI.
* Return score, total possible score, and 2 AI-generated improvement tips.
* Store submission in database for history tracking.

---

### `GET /quizzes/history`

**Description:**
Retrieves quiz history and scores with optional filters.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

* `grade` (integer)
* `subject` (string)
* `marks` (integer)
* `completedDate` (date)
* `from` (date) — e.g., `2024-09-01`
* `to` (date) — e.g., `2024-09-09`

**Example Request:**

```
GET /quizzes/history?grade=8&subject=Mathematics&from=2024-09-01&to=2024-09-09
```

**Response (200 OK):**

```json
[
  {
    "quizId": "12345",
    "gradeLevel": 8,
    "subject": "Mathematics",
    "score": 8,
    "total": 10,
    "completedDate": "2024-09-05"
  }
]
```

**Expected Behavior:**

* Return filtered quiz history from database.
* Support filtering by grade, subject, score, date, and date ranges.

---

## AI Features

### `GET /quizzes/{quizId}/questions/{questionId}/hint`

**Description:**
Generates an AI-powered hint for the specified question.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**

```json
{
  "questionId": "q1",
  "hint": "Think about the multiplication table for 12."
}
```

**Expected Behavior:**

* Use AI to generate a helpful, non-revealing hint.

---