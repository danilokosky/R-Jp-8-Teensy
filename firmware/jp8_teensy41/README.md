# Roland Jupiter-8 DSP Engine para Teensy 4.1 (PlatformIO + GitHub Actions)

Este projeto implementa uma réplica fiel em C++17 do motor de áudio do **Roland Jupiter-8** para a placa **Teensy 4.1** (ARM Cortex-M7 @ 600 MHz), baseado nas Notas de Serviço originais de dezembro de 1982.

## Como compilar diretamente pelo GitHub (Sem instalar IDE local)

1. Crie um repositório novo no GitHub (ex: `jp8-teensy41-synth`).
2. Extraia o arquivo `.zip` exportado e envie os arquivos para o GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: roland jp8 teensy 4.1 dsp engine"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/jp8-teensy41-synth.git
   git push -u origin main
   ```
3. Acesse a aba **Actions** no seu repositório do GitHub.
4. O workflow `.github/workflows/build-teensy41.yml` executará automaticamente:
   - **Job 1 (`native-dsp-tests`)**: Compila e testa o núcleo DSP (`include/JP8DspCore.h`) com `g++ -std=c++17 -Werror`.
   - **Job 2 (`compile-teensy41`)**: Instala o PlatformIO CLI, baixa o SDK do Teensy e gera o binário **`firmware.hex`**.
5. Ao final do build, clique no Artifact **`jp8-teensy41-firmware-...`** dentro do Action para baixar o `firmware.hex` e gravá-lo na placa via **Teensy Loader**!

## Compilação Local Opcional (PlatformIO)

```bash
# Testar o motor DSP nativamente no PC
g++ -std=c++17 -O2 -Wall -Wextra -Werror -I include test/test_jp8_dsp_native.cpp -lm -o test_dsp && ./test_dsp

# Compilar e gravar no Teensy 4.1 conectado via USB
pio run -e teensy41 -t upload
```
