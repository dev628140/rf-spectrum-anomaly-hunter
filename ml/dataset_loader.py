import os
from PIL import Image
from torch.utils.data import Dataset
import torchvision.transforms as transforms


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class SpectrogramDataset(Dataset):

    def __init__(self, subfolder):

        self.folder_path = os.path.join(BASE_DIR, "dataset", subfolder)

        self.image_paths = [
            os.path.join(self.folder_path, img)
            for img in os.listdir(self.folder_path)
            if img.endswith(".png")
        ]

        self.transform = transforms.Compose([
            transforms.Grayscale(num_output_channels=1),
            transforms.Resize((64, 64)),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):

        img_path = self.image_paths[idx]

        image = Image.open(img_path)

        image = self.transform(image)

        return image, image