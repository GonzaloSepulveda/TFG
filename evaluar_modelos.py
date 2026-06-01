import requests
import csv
import time

# Configuración de Ollama (Puerto por defecto)
OLLAMA_URL = "http://localhost:11434/api/generate"

# Nombres exactos de los modelos que tienes en Ollama
MODELS = ["mistral_base_h", "hermes2"] 
prompts = [
    "I'm going through some things with my feelings and myself. I barely sleep and I do nothing but think about how I'm worthless and how I shouldn't be here. I've never tried or contemplated suicide. I've always wanted to fix my issues, but I never get around to it. How can I change my feeling of being worthless to everyone?",
    "I have so many issues to address. I have a history of sexual abuse, I’m a breast cancer survivor and I am a lifetime insomniac. I have a long history of depression and I’m beginning to have anxiety. I have low self esteem but I’ve been happily married for almost 35 years. I’ve never had counseling about any of this. Do I have too many issues to address in counseling?",
    "I suffer from adult ADHD, anxiety disorder, and depression. It has been difficult to find a doctor in my area and my primary physician won't help. I am unemployed and overwhelmed. What would you suggest I do?",
    "I am going through a divorce. He is extremely angry. He refuses to physically assist me with our teenager daughter. I have no extended family support. Often times, I feel overwhelmed, tired, and joyless. I feel out of control, sad and depressed on a daily basis.",
    "I am not sure if I am depressed. I don't know how to bring it up to my parents, and that makes me miserable.",
    "Whenever I have to speak in public or be in big crowds, I freak out. I get light-headed, sweaty, and I have trouble breathing.",
    "I constantly feel like everyone is up against me and trying their best to shut me down. It's ruining my mood and even my whole self. I have trouble sleeping, and I keep having sleep paralysis while dreaming of others mocking and judging me.",
    "I'm going through a majorly bad divorce and my wife is making things so impossible for me. I need help.",
    "An organization admitted to implanting thoughts in my head with technologies. The study was to implant a fantasy other people are having, but to me, it's a nightmare. I lost my kids, my job, and all that. I was an unwilling participant. I no longer trust a therapist. I'm too afraid to go under hypnosis or anything.",
    "My roommate is a unapologetic person who doesn't care who she hurts. She never apologizes to me or my family. She made me lose my temper today to the point where I was using swear words in front of my mom and brother...",
    "It takes me a long time to fall asleep; I’d estimate about two hours. I often have nightmares, starting with being eaten by a monster, and I often wake up frightened and unable to breathe. I believe I started losing sleep after breaking up with a girlfriend of 8 years.",
    "My fiancé and I have almost the best relationship every girl wants, but lately it's changed. I get less attention and little to no intercourse. He works a lot and goes to the gym a lot, but he has no time for me.",
    "I'm a 40 year old male and having erection problems. Still have the desire for a woman. Awfully frustrated. Any suggestions? My Doc doesn't want to discuss it.",
    "My husband took a job out of state for the next year and seems to be a different person. Before, he worked and slept, and on off days, he'd stay home because he didn't want to do anything else. Now he's going out with friends several nights a week while I'm still home working a 50 hours a week job and taking care of two kids by myself.",
    "I'm having relationship problems and I want to fix them to make things right before I lose her. How can I learn how to listen and get myself together?",
    "I am lazy. I am very aware of the problem and try to talk myself out of it all the time, but I never seem to shake the habits. I try to think of what it is doing to me and my future, but no matter what, I keep creating excuses.",
    "I'm in a state of depression right now. Who can I talk to?",
    "I find myself lying about small everyday things that there is really no need to lie about. How do I figure out what triggers me to do this? And how do I help overcome this problem? I would like to become more honest and open no matter the situation.",
    "About 5 months ago my ex left without fully explaining why. For me it seemed out of the blue. I don't miss her as much as I used to but I just don't trust people anymore, not even my friends who I have known since my childhood not even my family.",
    "I found messages between my boyfriend and this girl on social media. He was asking her for naked pictures and then hung out with her once, but nothing happened. I didn’t find out about the messages until after the fact.",
    "My husband always works. He does work from home, but his hours are from morning until night, and he neglects his family. If I have anything I want to do, I have to find a babysitter, but he does what he wants.",
    "I've been hurt by a man for five years. He doesn't involve me with the family or kids. Everyone in the family is against me. There is a Mass today for a family member, and he never asked me to go. I'm to sit home alone now and Christmas too.",
    "I crave attention, companionship, and sex. She has had a hysterectomy, and she has a bad knee.",
    "My boyfriend of five months expresses how much he cares for me and then does things that hurt me. What should I do?",
    "I've been having this ongoing problem for most of my life now. I am a young adult, and right now, driving and even being a passenger gives me terrible panic attacks and anxiety. I can't ride in the backseat or the front seat with the safety belt on.",
    "I panicked over a minor parking lot mistake. It was totally my fault, but due to another insurance issue, I left a note with an illegible phone number. Guilty over this, I got an envelope containing several hundred dollars. Unfortunately, by the time I returned, the other driver had seen my ersatz note and drove away. How do I atone for my cowardly act?",
    "My husband and I have been married for seven years, and in that time, we have only had sex four or five times. Others have told me that most men would have left me by now. Honestly, I think I have a low sex drive or neither one of us actually knows what we are doing. I want to be better connected with my husband.",
    "I've been suppressing it for quite some time, but there are days when I can't make eye contact with her. I think she knows, and we both admitted there was some type of vibe, but the overall discussion was vague. I think she could possibly be dating someone that works with us. It's driving me crazy.",
    "Whether it's to a guy or girl, I always feel insecure talking, and I am afraid of embarrassing myself and not being good enough. Even when I am walking, I worry about my appearance and facial expression and such.",
    "My husband and I are separated and he doesn't even want to talk to me. He says he doesn't love me anymore, but I would do anything to get him back. Is there any hope?"
]

# Preparamos la estructura de datos donde guardaremos todo
resultados = [{"id_prompt": i+1, "prompt": p} for i, p in enumerate(prompts)]

print(f"Iniciando evaluación OPTIMIZADA de {len(prompts)} prompts...\n")

# Bucle principal: Primero un modelo entero, luego el otro
for model in MODELS:
    print("=" * 50)
    print(f"🚀 CARGANDO MODELO: {model}")
    print("El primer prompt tardará un poco mientras el modelo se sube a la memoria RAM...")
    print("=" * 50)
    
    for i, prompt in enumerate(prompts):
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            start_time = time.time()
            response = requests.post(OLLAMA_URL, json=payload)
            response.raise_for_status() 
            
            data = response.json()
            respuesta_texto = data.get("response", "").strip()
            tiempo_ejecucion = round(time.time() - start_time, 2)
            
            print(f"[{i+1}/30] ✅ {model} respondió en {tiempo_ejecucion}s")
            
        except requests.exceptions.RequestException as e:
            respuesta_texto = f"ERROR DE CONEXIÓN: {e}"
            print(f"[{i+1}/30] ❌ Error con {model}: {e}")
            
        # Guardamos la respuesta en el diccionario correspondiente a este prompt
        resultados[i][model] = respuesta_texto

    print(f"\n✅ Evaluaciones con el modelo '{model}' finalizadas.\n")

# Guardar los resultados en el CSV
nombre_archivo = "resultados_evaluacion_tfg_optimizado.csv"
columnas = ["id_prompt", "prompt"] + MODELS

with open(nombre_archivo, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=columnas)
    writer.writeheader()
    writer.writerows(resultados)

print(f"🎉 Evaluación completa.")
print(f"Tus resultados están en el archivo: {nombre_archivo}")