import httpx
import json
from typing import Dict, Any
from datetime import datetime
from app.config import settings


class YandexGPTService:
    def __init__(self):
        self.api_key = settings.yandex_api_key
        self.folder_id = settings.yandex_folder_id
        self.model = settings.yandex_model
        self.base_url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
    
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        """Отправка запроса к Yandex GPT"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {self.api_key}",
            "x-folder-id": self.folder_id
        }
        
        messages = []
        if system_prompt:
            messages.append({
                "role": "system",
                "text": system_prompt
            })
        messages.append({
            "role": "user",
            "text": prompt
        })
        
        payload = {
            "modelUri": f"gpt://{self.folder_id}/{self.model}/latest",
            "completionOptions": {
                "stream": False,
                "temperature": 0.3,
                "maxTokens": 4000
            },
            "messages": messages
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self.base_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["result"]["alternatives"][0]["message"]["text"]
    
    async def analyze_letter(self, subject: str, body: str) -> Dict[str, Any]:
        """Анализ входящего письма"""
        system_prompt = """Вы — профессиональный ИИ-ассистент для обработки деловой корреспонденции банка. Вы работаете на базе Yandex GPT и интегрированы в систему AI Banking Assistant. Ваша задача — провести глубокий анализ входящего письма.

ВАЖНО: В банке всего 2 отдела:
- Юридический отдел — согласование требуется если: регуляторный запрос от государственных органов, жалоба с угрозой судебного разбирательства, запрос содержит юридические риски, упоминаются законы/нормативные акты, запрос конфиденциальной информации о третьих лицах
- Отдел маркетинга — согласование требуется если: партнерское предложение о сотрудничестве, запрос от СМИ, вопросы о тарифах/продуктах/акциях, коммерческие предложения

Если не требуется согласование — ответ может быть отправлен напрямую (простые технические вопросы, типовые запросы информации)."""
        
        prompt = f"""Проанализируй входящее письмо и верни результат СТРОГО в формате JSON.

Тема письма: {subject}

Текст письма:
{body}

Верни JSON со следующей структурой:
{{
  "classification": {{
    "type": "один из: info_request, complaint, regulatory, partnership, approval_request, notification, other",
    "description": "краткое описание типа письма"
  }},
  "sla_hours": число_часов_на_ответ,
  "priority": число_от_1_до_3,
  "formality_level": "один из: strict_official, corporate, neutral, client_oriented",
  "required_departments": ["список", "отделов"],
  "extracted_entities": {{
    "request_summary": "суть запроса",
    "sender_details": "информация об отправителе",
    "legal_references": ["ссылки на законы"],
    "mentioned_documents": ["упомянутые документы"],
    "contact_info": "контактная информация"
  }},
  "risks": [
    {{
      "level": "high/medium/low",
      "description": "описание риска",
      "recommendation": "рекомендация"
    }}
  ],
  "approval_route": [
    {{
      "department": "название отдела",
      "reason": "зачем нужно согласование",
      "check_points": ["что проверить"]
    }}
  ],
  "controversial_points": ["список спорных моментов"]
}}

Возвращай ТОЛЬКО валидный JSON, без дополнительного текста."""

        response_text = await self.generate(prompt, system_prompt)
        
        # Извлечение JSON из ответа
        try:
            # Пытаемся найти JSON в ответе
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return json.loads(response_text)
        except json.JSONDecodeError as e:
            # Если не удалось распарсить, возвращаем структуру по умолчанию
            return {
                "classification": {"type": "other", "description": "Ошибка анализа"},
                "sla_hours": 24,
                "priority": 2,
                "formality_level": "neutral",
                "required_departments": [],
                "extracted_entities": {},
                "risks": [],
                "approval_route": [],
                "controversial_points": []
            }
    
    async def generate_responses(self, subject: str, body: str, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Генерация 4 вариантов ответа на основе нового системного промпта"""
        
        # Полный системный промпт из Version 2
        system_prompt = """Вы — профессиональный ИИ-ассистент для обработки деловой корреспонденции банка. Вы работаете на базе Yandex GPT и интегрированы в систему AI Banking Assistant. Ваша задача — автоматически сгенерировать 4 варианта качественного ответа, полностью соответствующих корпоративным стандартам, юридическим нормам и регуляторным требованиям.

В банке всего 2 отдела:
- Юридический отдел — согласование для регуляторных запросов, жалоб с юридическими рисками, запросов с упоминанием законов
- Отдел маркетинга — согласование для партнерских предложений, запросов от СМИ, вопросов о тарифах/продуктах

Вы должны сгенерировать 4 варианта ответа:

1. СТРОГИЙ ОФИЦИАЛЬНЫЙ (strict_official) - для государственных органов, регуляторов, судов:
   - Пассивные конструкции: "Банком установлено", "Принято решение"
   - Избегать местоимения "мы"
   - Юридическая терминология
   - Обязательные ссылки на законы

2. ДЕЛОВОЙ КОРПОРАТИВНЫЙ (corporate) - для партнеров, корпоративных клиентов:
   - Активные конструкции: "Мы рады сообщить"
   - Фокус на партнерстве
   - Умеренная официальность

3. КЛИЕНТООРИЕНТИРОВАННЫЙ (client_oriented) - для физических лиц, жалоб:
   - Эмпатия и понимание
   - Простые объяснения без жаргона
   - Персонализация
   - Позитивный тон

4. КРАТКИЙ ИНФОРМАЦИОННЫЙ (brief_info) - для простых запросов:
   - Максимальная лаконичность
   - Структурированная информация (списки)
   - Без лишних слов

КРИТИЧЕСКИ ВАЖНО:
✅ Используйте: "В соответствии с...", "Согласно положениям...", "Стремимся обеспечить"
❌ НИКОГДА: "Всегда", "Никогда", "Гарантируем 100%", признание вины без оговорок

Верните ТОЛЬКО JSON объект без markdown разметки, без дополнительного текста."""
        
        classification = analysis.get("classification", {})
        extracted = analysis.get("extracted_entities", {})
        risks = analysis.get("risks", [])
        
        prompt = f"""На основе входящего письма сгенерируй 4 полноценных варианта ответа.

Тема письма: {subject}

Текст письма:
{body}

Анализ письма:
- Тип: {classification.get('description', 'не определён')}
- Суть запроса: {extracted.get('request_summary', 'не указана')}
- Количество рисков: {len(risks)}

Верни JSON в формате:
{{
  "strict_official": "Полный текст строгого официального ответа для государственных органов и регуляторов",
  "corporate": "Полный текст делового корпоративного ответа для партнёров и корпоративных клиентов",
  "client_oriented": "Полный текст клиентоориентированного ответа для физических лиц и жалоб",
  "brief_info": "Полный текст краткого информационного ответа для простых запросов"
}}

Каждый вариант должен:
- Быть полным законченным письмом
- Отвечать на ВСЕ вопросы входящего письма
- Быть юридически безопасным
- Соответствовать стилю своей категории

Верни ТОЛЬКО валидный JSON без markdown блоков."""

        try:
            response_text = await self.generate(prompt, system_prompt)
            
            # Очистка от markdown разметки
            response_text = response_text.strip()
            response_text = response_text.replace('```json', '').replace('```', '')
            
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                responses = json.loads(json_str)
                
                # Проверка что все ключи присутствуют
                required_keys = ["strict_official", "corporate", "client_oriented", "brief_info"]
                if all(key in responses for key in required_keys):
                    return responses
                    
        except Exception as e:
            print(f"Ошибка генерации ответов: {e}")
        
        # Fallback - генерируем простой ответ
        return {
            "strict_official": f"Уважаемый отправитель,\n\nВаше обращение от {datetime.now().strftime('%d.%m.%Y')} по теме \"{subject}\" принято к рассмотрению. Ответ будет предоставлен в установленные сроки.\n\nС уважением,\nБанк",
            "corporate": f"Добрый день,\n\nБлагодарим за обращение. Ваш запрос принят в работу и будет обработан в ближайшее время.\n\nС уважением,\nКоманда банка",
            "client_oriented": f"Здравствуйте!\n\nСпасибо за ваше письмо. Мы получили ваш запрос и уже работаем над ним. В ближайшее время наши специалисты свяжутся с вами.\n\nС наилучшими пожеланиями,\nВаш банк",
            "brief_info": f"Ваше обращение принято. Ответ будет направлен в течение {analysis.get('sla_hours', 24)} часов."
        }


yandex_gpt_service = YandexGPTService()
