---
titulo: Teste de acesso via internet / celular
data: 2026-07-06
modulo: acesso-remoto
status: em-desenvolvimento
imagem: ""
imagens:
  - /uploads/unti3333333tled.png
  - /uploads/whatsapp-image-2026-07-07-at-10.37.48.jpeg
  - /uploads/222.jpeg
  - /uploads/whatsapp-image-2026-07-07-at-13232320.37.49.jpeg
  - /uploads/whatsapp-imageqweqweq-2026-07-07-at-10.37.49.jpeg
  - /uploads/whatsapp-image-2qweqweq026-07-07-at-10.37.49.jpeg
---
Teste com CloudFlare Tunnel. Até o momento, no desktop sem erros e na versão móvel ainda preciso fazer alguns ajustes visuais. Vou seguir o mesmo raciocínio para o Dashboard como um todo: Refinar o vendas, em seguida o financeiro e logo em seguida o orçamento.

Para realizarmos testes mais robustos será necessário adquirir um domínio (dygnusdash.com.br, por exemplo) para migrar para o CloudFlare, assim cada cliente terá sua rota própria, conectando em seu banco de dados, por exemplo:

equipamentosac.dygnusdash.com.br
fabianamoveis.dygnusdash.com.br

Cada um configurado para acessar sua própria base de dados. 

Estou estudando só como iniciar os serviços (dashboard - servidor netx.js e CloudFlare - serviço de Tunnel).

