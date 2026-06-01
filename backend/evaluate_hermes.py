import ollama
import pandas as pd
import json
from sklearn.metrics import classification_report, confusion_matrix

MACRO_CATEGORIES = {
    "1": "Depresión",
    "2": "Ansiedad / Pánico",
    "3": "Trauma / Adaptación",
    "4": "Trastorno Bipolar / Personalidad",
    "5": "Otro / Consulta general"
}

# (Aquí pegas tu dataset de 50 casos que te di en el mensaje anterior)
dataset = [
    {"id": 1, "text": "I'm going through some things with my feelings... I barely sleep and I do nothing but think about how I'm worthless and how I shouldn't be here.", "true_macro": "1"},
    {"id": 2, "text": "I have so many issues to address. I have a history of sexual abuse... I am a lifetime insomniac. I have a long history of depression and I’m beginning to have anxiety.", "true_macro": "3"},
    {"id": 3, "text": "I have been feeling more and more down for over a month. I have started having trouble sleeping due to panic attacks...", "true_macro": "2"},
    {"id": 4, "text": "I’m facing severe depression and anxiety and I just feel like I’m going through a lot. This really distracts me and I cant get my mind off the things...", "true_macro": "1"},
    {"id": 5, "text": "How can I get to a place where I can be content from day to day?", "true_macro": "5"},
    {"id": 6, "text": "I have a severe back problem. I've had 3 major and several minor operations, but I'm still in constant pain. How can I deal with the depression...", "true_macro": "1"},
    {"id": 7, "text": "I suffer from adult ADHD, anxiety disorder, and depression. It has been difficult to find a doctor in my area...", "true_macro": "5"},
    {"id": 8, "text": "A few years ago I was making love to my wife when for no known reason I lost my erection... This has resulted in ongoing depression...", "true_macro": "1"},
    {"id": 9, "text": "I struggle with depression as well as pretty intense mood swings... I experience highs where I feel amazing... and then lows where I lack focus...", "true_macro": "4"},
    {"id": 10, "text": "I self-harm, and I stop for awhile. Then when I see something sad or depressing, I automatically want to self-harm.", "true_macro": "1"},
    {"id": 11, "text": "I have been diagnosed with general anxiety and depression by my family doctor. They wrote a prescription for me to have an emotional support dog...", "true_macro": "2"},
    {"id": 12, "text": "I tried telling my husband I was depressed, and he ignored me. He said 'you're always sad or depressed.'...", "true_macro": "1"},
    {"id": 13, "text": "It's not entirely true to say I enjoy being sad, but I always find a way to feel that way. I listen to sad music, read tragic stories...", "true_macro": "1"},
    {"id": 14, "text": "Every winter I find myself getting sad because of the weather. How can I fight this?", "true_macro": "1"},
    {"id": 15, "text": "I am going through a divorce. He is extremely angry. He refuses to physically assist me... I feel out of control, sad and depressed on a daily basis.", "true_macro": "3"},
    {"id": 16, "text": "I just don't know what I want in life anymore. I'm can't figure out what it is that is keeping me distracted and unfocused. I can't put things into perspective...", "true_macro": "5"},
    {"id": 17, "text": "I'm not suicidal and wouldn't take my own life, but sometimes, I've wished for an accident to occur and take it...", "true_macro": "1"},
    {"id": 18, "text": "I can't even smile or fake one. I can't feel happiness about anything... I can't get over the loss of a loved one and I'm not close to my family.", "true_macro": "3"},
    {"id": 19, "text": "My girlfriend just quit drinking and she became really depressed. She told me that she wants to move. What can I do to help her?", "true_macro": "5"},
    {"id": 20, "text": "I'm a teenager. My dad has been jail for the last five years. It's tough... I feel like I took upon a parent role... I keep breaking down.", "true_macro": "3"},
    {"id": 21, "text": "I'm in my mid 20s with a husband and children. I love my family, but I feel like I've lost my identity... I feel unhappy and trapped...", "true_macro": "5"},
    {"id": 22, "text": "I have been dealing with depression and anxiety for a number of years. I have been on medication, but lately my depression has felt worse.", "true_macro": "1"},
    {"id": 23, "text": "There are many people willing to lovingly provide me with a home. I have food, clothes... but I never feel like I belong. I feel like I'm just out with friends...", "true_macro": "5"},
    {"id": 24, "text": "I am really worried about one of my friends because I think he has major depression... He told me he feels empty inside...", "true_macro": "5"},
    {"id": 25, "text": "I've become so jaded that I can't control my thoughts. I cannot focus on anything and been having anxiety attacks.", "true_macro": "2"},
    {"id": 26, "text": "When I get around a particular person or when I go home, I'm just sad or irritated. The feeling comes and goes all day every day.", "true_macro": "3"},
    {"id": 27, "text": "I am a teenager. I have been experiencing major episodes of depression... I have been having panic attacks, feeling like I can't control my fears...", "true_macro": "2"},
    {"id": 28, "text": "I feel lazy and numb. I have no interest in things.", "true_macro": "1"},
    {"id": 29, "text": "I'm currently struggling with diagnosed depression, anxiety, and Misophonia. Also, I am 99% sure I have Borderline Personality Disorder...", "true_macro": "4"},
    {"id": 30, "text": "In the past year, two of my best and only close friends moved to different states. Now I have nobody to hang out with. I'm always alone...", "true_macro": "3"},
    {"id": 31, "text": "I am the problem. I make my family argue because of me... I am worthless. I can't stop crying. Sometimes I have to cry myself to sleep.", "true_macro": "1"},
    {"id": 32, "text": "I'm depressed often, and my mind goes a million miles a minute... I start noticing that I am picking at my skin profusely. After roughly a week, the anxiety is back...", "true_macro": "2"},
    {"id": 33, "text": "I'm very depressed. How do I find someone to talk to?", "true_macro": "1"},
    {"id": 34, "text": "I'm constantly in a bad mood and I have no energy. Is that depression?", "true_macro": "1"},
    {"id": 35, "text": "I'm in my late teens and live with my dad. The only time I go out is for my college classes... Sometimes I feel i'm not worth knowing...", "true_macro": "2"},
    {"id": 36, "text": "She has trouble falling and staying asleep and she's always either extremely hungry or not hungry at all. She also gets angry and feels like crying...", "true_macro": "5"},
    {"id": 37, "text": "I'm a teenager and I I go through periods of moodiness... I have trust issues, low self esteem, extreme fear of abandonment, and I constantly reevaluate my relationships.", "true_macro": "4"},
    {"id": 38, "text": "I had a very troubled up bringing and I'm currently dealing with alot right now. I feel overwhelmed. Could this be depression?", "true_macro": "3"},
    {"id": 39, "text": "I think adult life is making him depressed and we often sleep in on weekends untill 1 or 2 pm. We just eat, smoke weed, watch movies... He doesn't seem motivated...", "true_macro": "5"},
    {"id": 40, "text": "My mother is combative with me when I say I don't want to talk with her about my depression. She hasn't been supportive of me in the past...", "true_macro": "3"},
    {"id": 41, "text": "I just feel sad all the time and I don't like anyone in my family. I feel like they're trying to control me and won't let me grow.", "true_macro": "3"},
    {"id": 42, "text": "I can't seem to feel any emotion except anxiety, not even for myself.", "true_macro": "2"},
    {"id": 43, "text": "I know I need to deal with my depression. But I don't know how and I don't want to tell anyone. How can I deal with depression without telling anyone?", "true_macro": "1"},
    {"id": 44, "text": "I'm dealing with an illness that will never go away and I feel like my life will never change for the better. I feel alone and that i have no one.", "true_macro": "1"},
    {"id": 45, "text": "How do I make myself happy without the people who made me happy? Now that they’re gone, I feel sad. It’s been two months now but I seem to be unable to stay okay...", "true_macro": "3"},
    {"id": 46, "text": "I feel like I am internally screaming all the time. Externally, I am calm, but I have this intense, unidentifiable emotion constantly. I don't feel sad... I feel rather emotionally distant...", "true_macro": "2"},
    {"id": 47, "text": "I've never been able to talk with my parents... I feel that they do not take me seriously... I’m a pansexual, but I can’t trust my own parents. I've fought depression and won; however, stress and anxiety are killing me.", "true_macro": "2"},
    {"id": 48, "text": "I don't know how else to explain it. All I can say is that I feel empty, I feel nothing. How do I stop feeling this way?", "true_macro": "1"},
    {"id": 49, "text": "People who are parental figures in my life have, in the past, hurt me... I am going through a lot of my past garbage and trying to figure out when it all went wrong... I don't know who I am anymore.", "true_macro": "3"},
    {"id": 50, "text": "I am going through a very hard time and I'm so depressed. My parents are getting a divorce and a lot of bad things are happening. I want to lull myself.", "true_macro": "3"}
]

def map_disorder_to_macro(disorder_name):
    """Traduce el nombre libre del trastorno a una de nuestras 5 categorías"""
    name = str(disorder_name).lower()
    if "depres" in name or "distimia" in name or "suicid" in name:
        return "1"
    elif "ansiedad" in name or "pánico" in name or "fobia" in name or "social" in name:
        return "2"
    elif "trauma" in name or "adaptación" in name or "tept" in name or "estrés" in name:
        return "3"
    elif "bipolar" in name or "límite" in name or "personalidad" in name or "tca" in name:
        return "4"
    else:
        return "5"

def extract_json_from_response(response_text):
    """Intenta extraer un JSON válido incluso si el modelo añade texto antes o después"""
    try:
        # Buscar los límites del JSON
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = response_text[start:end]
            return json.loads(json_str)
    except Exception:
        pass
    return None

def evaluate_hermes():
    print("🤖 Iniciando evaluación con tu prompt de producción...\n")
    y_true = []
    y_pred = []

    for item in dataset:
        # TU PROMPT EXACTO DE PRODUCCIÓN
        prompt = f"""Eres un asistente psicológico especializado en análisis de patrones de comportamiento y síntomas.
            
Analiza las siguientes expresiones del usuario y proporciona un análisis estructurado sobre posibles trastornos o condiciones mentales.

CONVERSACIONES DEL USUARIO:
{item['text']}

Por favor, proporciona tu análisis en el siguiente formato JSON exactamente:
{{
    "overall_assessment": "Una evaluación general breve sobre el estado emocional del usuario",
    "detected_patterns": ["patrón 1", "patrón 2"],
    "possible_disorders": [
        {{
            "name": "nombre del trastorno (ej: Depresión, Ansiedad)",
            "confidence": "Alta/Media/Baja",
            "indicators": ["indicador 1", "indicador 2"]
        }}
    ],
    "recommendations": ["recomendación 1", "recomendación 2"]
}}"""

        try:
            response = ollama.generate(
                model="hermes2", 
                prompt=prompt, 
                stream=False,
                options={"num_ctx": 1024} # Ayuda a que no consuma tanta RAM
            )
            
            response_text = response.get("response", "")
            
            # 1. Parsear el JSON
            analysis_data = extract_json_from_response(response_text)
            
            pred_macro = "5" # Por defecto
            detected_name = "Desconocido"
            
            # 2. Extraer el nombre del trastorno y mapearlo
            if analysis_data and "possible_disorders" in analysis_data and len(analysis_data["possible_disorders"]) > 0:
                detected_name = analysis_data["possible_disorders"][0].get("name", "Desconocido")
                pred_macro = map_disorder_to_macro(detected_name)
                
        except Exception as e:
            print(f"Error evaluando ID {item['id']}: {e}")
            pred_macro = "5"
            detected_name = "Error/Timeout"

        y_true.append(item["true_macro"])
        y_pred.append(pred_macro)
        
        print(f"Caso {item['id']} -> Real: {MACRO_CATEGORIES[item['true_macro']]} | IA detectó: '{detected_name}' -> Mapeado a: {MACRO_CATEGORIES[pred_macro]}")

    # Generar Reporte
    print("\n" + "="*50)
    print("📊 RESULTADOS DE LA EVALUACIÓN (GOLD STANDARD)")
    print("="*50)
    
    target_names = [MACRO_CATEGORIES[k] for k in sorted(list(set(y_true + y_pred)))]
    
    print("\nMatriz de Confusión:")
    print(confusion_matrix(y_true, y_pred))
    
    print("\nReporte de Precisión (F1-Score, Recall, Precision):")
    print(classification_report(y_true, y_pred, target_names=target_names, zero_division=0))

if __name__ == "__main__":
    evaluate_hermes()