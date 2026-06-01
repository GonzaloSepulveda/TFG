import pandas as pd
import json
import nltk
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer

# Descargar paquetes de tokenización necesarios
nltk.download('punkt')
nltk.download('punkt_tab')

def calcular_metricas(csv_file, json_file):
    # Cargar los datos del CSV
    df = pd.read_csv(csv_file)
    
    # Cargar el JSON línea por línea (formato JSONL)
    dataset = []
    with open(json_file, 'r', encoding='utf-8') as f:
        for linea in f:
            if linea.strip(): # Evitar leer líneas en blanco
                dataset.append(json.loads(linea))
        
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
    smoothie = SmoothingFunction().method4
    
    # Inicializar listas para los tres modelos
    bleu_mistral, rouge_mistral = [], []
    bleu_hermes, rouge_hermes = [], []
    bleu_gemini, rouge_gemini = [], [] # Nuevas listas para Gemini
    
    print("Calculando solapamiento semántico (BLEU/ROUGE)...")
    
    for index, row in df.iterrows():
        prompt_csv = str(row['prompt']).strip()
        
        # Buscar la respuesta real (ground truth del terapeuta) en el JSON original
        referencia_real = None
        for item in dataset:
            # Comparamos los primeros 50 caracteres para evitar fallos por saltos de línea
            if prompt_csv[:50] in item.get('Context', '').replace('"', '\\"').replace('\n', ' '):
                referencia_real = item.get('Response', '')
                break
                
        if not referencia_real:
            continue
            
        # Tokenizamos la respuesta real
        ref_tokens = nltk.word_tokenize(referencia_real.lower())
        
        # --- Evaluar Mistral Base ---
        res_mistral = str(row['mistral_base_h'])
        mistral_tokens = nltk.word_tokenize(res_mistral.lower())
        bleu_mistral.append(sentence_bleu([ref_tokens], mistral_tokens, smoothing_function=smoothie))
        rouge_mistral.append(scorer.score(referencia_real, res_mistral)['rougeL'].fmeasure)
        
        # --- Evaluar Hermes ---
        res_hermes = str(row['hermes2'])
        hermes_tokens = nltk.word_tokenize(res_hermes.lower())
        bleu_hermes.append(sentence_bleu([ref_tokens], hermes_tokens, smoothing_function=smoothie))
        rouge_hermes.append(scorer.score(referencia_real, res_hermes)['rougeL'].fmeasure)

        # --- Evaluar Gemini 3.1 Pro ---
        # CAMBIA 'gemini_3_1_pro' POR EL NOMBRE EXACTO DE TU COLUMNA EN EL CSV
        res_gemini = str(row['gemini_3_1_pro']) 
        gemini_tokens = nltk.word_tokenize(res_gemini.lower())
        bleu_gemini.append(sentence_bleu([ref_tokens], gemini_tokens, smoothing_function=smoothie))
        rouge_gemini.append(scorer.score(referencia_real, res_gemini)['rougeL'].fmeasure)

    # Imprimir los resultados para el TFG
    print("\n" + "="*50)
    print("RESULTADOS FINALES PARA LA MEMORIA (TABLA)")
    print("="*50)
    
    # Comprobamos que haya datos para evitar divisiones por cero
    if len(bleu_mistral) > 0 and len(bleu_hermes) > 0 and len(bleu_gemini) > 0:
        print(f"MISTRAL BASE    -> BLEU-4: {sum(bleu_mistral)/len(bleu_mistral):.4f} | ROUGE-L: {sum(rouge_mistral)/len(rouge_mistral):.4f}")
        print(f"HERMES          -> BLEU-4: {sum(bleu_hermes)/len(bleu_hermes):.4f} | ROUGE-L: {sum(rouge_hermes)/len(rouge_hermes):.4f}")
        print(f"GEMINI 3.1 PRO  -> BLEU-4: {sum(bleu_gemini)/len(bleu_gemini):.4f} | ROUGE-L: {sum(rouge_gemini)/len(rouge_gemini):.4f}")
    else:
        print("No se encontraron coincidencias para calcular las métricas.")
    print("="*50)

if __name__ == "__main__":
    # Asegúrate de que los nombres de los archivos coinciden
    calcular_metricas('RespuestasModelosAlegacionesTFG.csv', 'combined_dataset.json')