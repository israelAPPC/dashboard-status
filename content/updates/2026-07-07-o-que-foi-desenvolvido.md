---
titulo: O que foi desenvolvido
data: 2026-07-07
modulo: roteirizacao
status: finalizado
imagens:
  - /uploads/rot_1png.png
  - /uploads/roteirizacao2.png
  - /uploads/untitled1.png
---
- Exibe os pedidos do Dygnus que possuem ao menos 1 item não entregue (configuração deve ser habilitada no Dygnus);
- Selecionamos o pedido e com uma API configurada para o MapBox (permite até 100k requisições de graça), monta a rota mais otimizada, baseada no ponto de partida (API e ponto de partida estão na configuração);
- Salva roteirização, com número e PDF Sintético (somente número do pedido, cliente e endereço) ou Analítico (Tudo do sintético + itens a serem entregues).
