import os
import numpy as np
import matplotlib.pyplot as plt


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OUTPUT_DIR = os.path.join(BASE_DIR, "real_data_pipeline")

CONFUSION_PATH = os.path.join(
    OUTPUT_DIR,
    "confusion_matrix.png"
)

METRICS_PATH = os.path.join(
    OUTPUT_DIR,
    "final_metrics.txt"
)

BAR_CHART_PATH = os.path.join(
    OUTPUT_DIR,
    "metrics_bar_chart.png"
)


TP = 59
FP = 2
TN = 117
FN = 0

TOTAL = TP + FP + TN + FN


accuracy = ((TP + TN) / TOTAL) * 100

precision = (TP / (TP + FP)) * 100

recall = (TP / (TP + FN)) * 100

specificity = (TN / (TN + FP)) * 100

f1 = (
    2 * (precision * recall)
    / (precision + recall)
)


with open(METRICS_PATH, "w") as f:
    f.write(f"TP: {TP}\n")
    f.write(f"FP: {FP}\n")
    f.write(f"TN: {TN}\n")
    f.write(f"FN: {FN}\n\n")

    f.write(f"Accuracy: {accuracy:.2f}%\n")
    f.write(f"Precision: {precision:.2f}%\n")
    f.write(f"Recall: {recall:.2f}%\n")
    f.write(f"Specificity: {specificity:.2f}%\n")
    f.write(f"F1 Score: {f1:.2f}%\n")


# CONFUSION MATRIX
matrix = np.array([
    [TN, FP],
    [FN, TP]
])

plt.figure(figsize=(6, 5))

plt.imshow(matrix)

for i in range(2):
    for j in range(2):
        plt.text(
            j,
            i,
            str(matrix[i][j]),
            ha='center',
            va='center',
            fontsize=16
        )

plt.xticks([0, 1], ["Pred Normal", "Pred Anomaly"])
plt.yticks([0, 1], ["Actual Normal", "Actual Anomaly"])

plt.title("Confusion Matrix")
plt.colorbar()
plt.tight_layout()
plt.savefig(CONFUSION_PATH)
plt.close()


# METRICS BAR CHART
metric_names = [
    "Accuracy",
    "Precision",
    "Recall",
    "Specificity",
    "F1"
]

metric_values = [
    accuracy,
    precision,
    recall,
    specificity,
    f1
]

plt.figure(figsize=(10, 6))

bars = plt.bar(
    metric_names,
    metric_values
)

for bar, value in zip(bars, metric_values):
    plt.text(
        bar.get_x() + bar.get_width()/2,
        value + 0.5,
        f"{value:.2f}%",
        ha='center'
    )

plt.ylim(0, 110)

plt.title("Final Model Performance Metrics")
plt.ylabel("Percentage")

plt.tight_layout()
plt.savefig(BAR_CHART_PATH)
plt.close()


print("FINAL RESULTS")
print("-------------")
print("Accuracy:", f"{accuracy:.2f}%")
print("Precision:", f"{precision:.2f}%")
print("Recall:", f"{recall:.2f}%")
print("Specificity:", f"{specificity:.2f}%")
print("F1 Score:", f"{f1:.2f}%")

print("\nSaved:")
print(CONFUSION_PATH)
print(METRICS_PATH)
print(BAR_CHART_PATH)