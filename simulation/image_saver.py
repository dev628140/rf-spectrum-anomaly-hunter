import matplotlib.pyplot as plt


def save_spectrogram_image(spec, path):

    plt.figure(figsize=(4,4))

    plt.imshow(
        spec,
        aspect='auto',
        origin='lower',
        cmap='inferno'
    )

    plt.axis("off")

    plt.savefig(
        path,
        bbox_inches="tight",
        pad_inches=0
    )

    plt.close()