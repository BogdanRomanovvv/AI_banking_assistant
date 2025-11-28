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
        system_prompt = """Ты — интеллектуальный корпоративный ассистент для обработки официальной деловой корреспонденции банка. Твоя задача — анализировать входящие письма, классифицировать их, извлекать ключевую информацию и определять параметры обработки."""
        
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
        """Генерация 4 вариантов ответа"""
        system_prompt = """Ты — эксперт по деловой переписке в банковской сфере. Твоя задача — формировать юридически корректные, профессиональные ответы на официальную корреспонденцию."""
        
        classification = analysis.get("classification", {})
        extracted = analysis.get("extracted_entities", {})
        risks = analysis.get("risks", [])
        
        prompt = f"""На основе анализа входящего письма сгенерируй 4 варианта ответа.

Тема письма: {subject}
Текст письма: {body}

Анализ:
- Тип: {classification.get('description', 'не определён')}
- Суть запроса: {extracted.get('request_summary', 'не указана')}
- Риски: {len(risks)} выявлено

Создай 4 варианта ответа в формате JSON (без markdown разметки, только чистый JSON):
{{
  "strict_official": "строгий официальный ответ для регуляторов и госорганов, с соблюдением всех формальностей",
  "corporate": "деловой корпоративный ответ для партнёров и контрагентов",
  "client_oriented": "клиентоориентированный ответ для физических/юридических лиц",
  "brief_info": "краткий информационный ответ для простых запросов"
}}

ВАЖНО: Верни только JSON объект, без объяснений, без markdown блоков (```json), без дополнительного текста."""

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
