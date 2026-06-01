import torch
import numpy as np
import cv2


class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer

        self.gradients = None
        self.activations = None

        # ✅ Use modern hooks (IMPORTANT FIX)
        self.target_layer.register_forward_hook(self.forward_hook)
        self.target_layer.register_full_backward_hook(self.backward_hook)

    def forward_hook(self, module, input, output):
        self.activations = output

    def backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate(self, input_tensor, error_map):

        self.model.zero_grad()

        # 🔥 IMPORTANT: use error map as signal
        loss = error_map.mean()
        loss.backward()

        gradients = self.gradients[0].cpu().detach().numpy()
        activations = self.activations[0].cpu().detach().numpy()

        # Global average pooling on gradients
        weights = np.mean(gradients, axis=(1, 2))

        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)

        # Normalize
        cam = cv2.resize(cam, (64, 64))
        cam -= cam.min()
        cam /= (cam.max() + 1e-8)

        return cam