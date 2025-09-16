# pAIrReview 
**Bias Mitigation for LLM-Assisted Systematic Literature Reviews**  

BM4LLM-SLR is a model designed to support researchers during the **study selection phase** of **Systematic Literature Reviews (SLRs)**. Its primary objective is to enhance the use of **Large Language Models (LLMs)** by making them more **reliable, transparent, and less prone to bias**.  

---

## 🚀 Why pAIrReview?  

Systematic Literature Reviews are critical for consolidating scientific evidence but require **substantial manual effort** and are susceptible to **human error**. While **LLMs** can assist in this process, they may also introduce **bias or inconsistencies** if applied in isolation.  

BM4LLM-SLR introduces a **bias mitigation layer**, offering:  
- ✅ **Configurable confidence thresholds**  
- ✅ **Rigorous control mechanisms for study selection**  
- ✅ **Active engagement of the human reviewer**  

These features increase the **robustness** of results while reducing the likelihood of bias.  

---

## 📂 Repository Contents  

This repository provides a tool designed to support the usage of LLMs in paper scrutiny in SLR process. Below is an overview of the key functionalities.  

### **Index**  
Provides an overview of the tool’s purpose. If human participants are involved, this section displays a notification that collected data will be used for research purposes, along with the author’s details. Researchers reusing this tool are encouraged to adapt the disclaimer to their own studies.  

### **My Review**  
Allows participants to configure the tool with their data. Key inputs include:  
- The **metadata** (title, abstract, keywords).
- The **criteria** used for inclusion and exclusion.  
- The **prompt template** (three options available).
- The **data** extracted from electronic database searches
- The **LLMs** used.

### **Automatic Selection**  
Initiates prompt submission to the chosen LLMs. Selected studies are displayed with prompts ready for evaluation. Results are exported in CSV format and stored for subsequent review.  

### **Automated Review**  
Enables configuration of a **confidence threshold** (1–7 Likert scale). Articles are automatically included or excluded based on this threshold, with a recommendation of ≥6 for reliable decisions. Preliminary results can be exported in `.zip` format.  

### **Consensus Building**  
Validates automatic selections. If accepted, the process continues; if rejected, it returns to the setup stage for revision of prompts, templates, or criteria.  
- **Low-confidence mode:** Aggregates outputs from two additional LLMs to build an artificial consensus.  
- **High-confidence mode:** Combines one LLM’s output with human judgment.  

### **Final Report**  
Summarizes experiment outcomes by calculating performance metrics, including:  
- True Positives (TP)  
- False Positives (FP)  
- True Negatives (TN)  
- False Negatives (FN)  
- Accuracy and recall  
---
