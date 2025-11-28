import httpx
import json
import os
from typing import Dict, Any
from datetime import datetime
from app.config import settings


class YandexGPTService:
    def __init__(self):
        self.api_key = settings.yandex_api_key
        self.folder_id = settings.yandex_folder_id
        self.model = settings.yandex_model
        self.base_url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Загрузка базы знаний банка из JSON файла"""
        try:
            kb_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "knowledge_base.json")
            with open(kb_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Ошибка загрузки базы знаний: {e}")
            return {}
    
    def _format_knowledge_base(self) -> str:
        """Форматирование базы знаний для промпта"""
        if not self.knowledge_base:
            return ""
        
        kb_text = "\n\n=== БАЗА ЗНАНИЙ БАНКА ===\n\n"
        
        # Основная информация о банке
        if "bank_info" in self.knowledge_base:
            info = self.knowledge_base["bank_info"]
            kb_text += f"**{info.get('full_name')}**\n"
            kb_text += f"Краткое название: {info.get('short_name')}\n"
            kb_text += f"Слоган: {info.get('slogan')}\n\n"
            
            if "legal_details" in info:
                legal = info["legal_details"]
                kb_text += f"ИНН: {legal.get('inn')}, КПП: {legal.get('kpp')}\n"
                kb_text += f"ОГРН: {legal.get('ogrn')}, БИК: {legal.get('bik')}\n"
                kb_text += f"Юр. адрес: {legal.get('legal_address')}\n\n"
            
            if "contact_info" in info:
                contact = info["contact_info"]
                kb_text += f"Телефон: {contact.get('main_phone')}\n"
                kb_text += f"Email: {contact.get('email_general')}\n"
                kb_text += f"Сайт: {contact.get('website')}\n\n"
        
        # Кредитные продукты
        if "credit_products" in self.knowledge_base:
            kb_text += "**КРЕДИТНЫЕ ПРОДУКТЫ:**\n\n"
            credits = self.knowledge_base["credit_products"]
            
            if "consumer_loans" in credits:
                cl = credits["consumer_loans"]
                kb_text += f"1. {cl.get('name')}: ставка от {cl['interest_rate']['min']}%, "
                kb_text += f"сумма от {cl['amount']['min']:,} до {cl['amount']['max']:,} руб, "
                kb_text += f"срок до {cl['term']['max_months']} мес\n"
            
            if "mortgage" in credits:
                mort = credits["mortgage"]
                kb_text += f"2. {mort.get('name')}: ставка от {mort['programs']['standard']['interest_rate']['min']}%, "
                kb_text += f"первый взнос от {mort['programs']['standard']['initial_payment']['min_percent']}%\n"
            
            if "car_loan" in credits:
                car = credits["car_loan"]
                kb_text += f"3. {car.get('name')}: ставка от {car['new_car']['interest_rate']['min']}%, "
                kb_text += f"сумма до {car['new_car']['amount']['max']:,} руб\n"
            
            if "credit_cards" in credits:
                cc = credits["credit_cards"]
                kb_text += f"4. {cc.get('name')}: лимит до {cc['limit']['max']:,} руб, "
                kb_text += f"льготный период {cc['interest_rate']['grace_period_days']} дней, кэшбэк {cc['cashback']['standard']}\n"
            
            kb_text += "\n"
        
        # Депозиты
        if "deposit_products" in self.knowledge_base:
            kb_text += "**ВКЛАДЫ:**\n\n"
            deposits = self.knowledge_base["deposit_products"]
            
            for key, dep in deposits.items():
                if isinstance(dep, dict) and "name" in dep:
                    rates = dep.get("interest_rate", {})
                    if isinstance(rates, dict):
                        max_rate = max([v for v in rates.values() if isinstance(v, (int, float))], default=0)
                        kb_text += f"- {dep['name']}: до {max_rate}% годовых\n"
            
            kb_text += "\n"
        
        # Тарифы
        if "tariffs_and_fees" in self.knowledge_base:
            kb_text += "**ОСНОВНЫЕ ТАРИФЫ:**\n"
            tariffs = self.knowledge_base["tariffs_and_fees"]
            
            if "transfers" in tariffs:
                kb_text += "- Переводы внутри банка: бесплатно\n"
                kb_text += "- Переводы по СБП: бесплатно\n"
            
            if "account_services" in tariffs:
                services = tariffs["account_services"]
                if "sms_notifications" in services:
                    kb_text += f"- СМС-уведомления: {services['sms_notifications']['fee_per_month']} руб/мес\n"
        
        return kb_text
    
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

КРИТИЧЕСКИ ВАЖНО: 
- Если письмо содержит фразы "ответ не требуется", "для сведения", "настоящее уведомление" — это УВЕДОМЛЕНИЕ, согласование НЕ требуется!
- Для уведомлений approval_route должен быть ПУСТЫМ МАССИВОМ []
- Если не требуется согласование — approval_route должен быть пустым (простые технические вопросы, типовые запросы информации, УВЕДОМЛЕНИЯ)"""
        
        prompt = f"""Проанализируй входящее письмо и верни результат СТРОГО в формате JSON.

Тема письма: {subject}

Текст письма:
{body}

Верни JSON со следующей структурой:
{{
  "classification": {{
    "type": "один из: notification, info_request, complaint, regulatory, partnership, approval_request, other",
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

ВАЖНО: Если type == "notification" (письмо содержит "ответ не требуется"), то approval_route должен быть []

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
        
        # Проверка: если это уведомление, не генерируем ответы
        classification = analysis.get("classification", {})
        if classification.get("type") == "notification":
            return {
                "strict_official": "Уведомление принято к сведению. Ответ не требуется.",
                "corporate": "Благодарим за информацию. Принято к сведению.",
                "client_oriented": "Спасибо, что уведомили нас. Информация принята.",
                "brief_info": "Принято к сведению."
            }
        
        # Полный системный промпт из Version 2 с базой знаний
        knowledge_base_text = self._format_knowledge_base()
        
        system_prompt = f"""Вы — профессиональный ИИ-ассистент для обработки деловой корреспонденции банка. Вы работаете на базе Yandex GPT и интегрированы в систему AI Banking Assistant. Ваша задача — автоматически сгенерировать 4 варианта качественного ответа, полностью соответствующих корпоративным стандартам, юридическим нормам и регуляторным требованиям.

{knowledge_base_text}

ВАЖНО: Используйте ТОЛЬКО информацию из базы знаний банка выше. НЕ ВЫДУМЫВАЙТЕ цифры, условия, тарифы! Если информации нет в базе знаний - укажите [ТРЕБУЕТСЯ УТОЧНЕНИЕ].

В банке всего 2 отдела:
- Юридический отдел — согласование для регуляторных запросов, жалоб с юридическими рисками, запросов с упоминанием законов
- Отдел маркетинга — согласование для партнерских предложений, запросов от СМИ, вопросов о тарифах/продуктах

Вы должны сгенерировать 4 варианта ответа:

1. СТРОГИЙ ОФИЦИАЛЬНЫЙ (strict_official) - для государственных органов, регуляторов, судов:
   - Пассивные конструкции: "Банком установлено", "Принято решение"
   - Избегать местоимения "мы"
   - Юридическая терминология
   - Обязательные ссылки на законы
   - Использовать полное название банка и реквизиты из базы знаний

2. ДЕЛОВОЙ КОРПОРАТИВНЫЙ (corporate) - для партнеров, корпоративных клиентов:
   - Активные конструкции: "Мы рады сообщить"
   - Фокус на партнерстве
   - Умеренная официальность
   - Указывать контактные данные из базы знаний

3. КЛИЕНТООРИЕНТИРОВАННЫЙ (client_oriented) - для физических лиц, жалоб:
   - Эмпатия и понимание
   - Простые объяснения без жаргона
   - Персонализация
   - Позитивный тон
   - Конкретные цифры из базы знаний (ставки, суммы, сроки)

4. КРАТКИЙ ИНФОРМАЦИОННЫЙ (brief_info) - для простых запросов:
   - Максимальная лаконичность
   - Структурированная информация (списки)
   - Без лишних слов
   - Точные данные из базы знаний

КРИТИЧЕСКИ ВАЖНО:
✅ Используйте: "В соответствии с...", "Согласно положениям...", "Стремимся обеспечить"
❌ НИКОГДА: "Всегда", "Никогда", "Гарантируем 100%", признание вины без оговорок
✅ ОБЯЗАТЕЛЬНО: Все цифры, условия, тарифы ТОЛЬКО из базы знаний выше

Верните ТОЛЬКО JSON объект без markdown разметки, без дополнительного текста."""
        
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
