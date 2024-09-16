# Autenticação de Usuários (Single Server)

A autenticação de usuários em um ambiente de servidor único (single server) é o processo de verificar se um usuário é quem ele afirma ser antes de conceder acesso ao sistema. Esse processo é essencial para proteger dados e garantir que somente pessoas autorizadas possam realizar determinadas ações ou visualizar informações.

No modelo de **single server**, todas as requisições de autenticação são processadas por um único servidor central. Isso significa que cada vez que um usuário tenta acessar o sistema, ele envia suas credenciais (como nome de usuário e senha) para esse servidor. O servidor, por sua vez, compara essas credenciais com as informações armazenadas em seu banco de dados e, se corresponderem, concede o acesso ao usuário.

---

## Autenticação vs Autorização

**Autenticação** é o processo de confirmar quem a pessoa é.  
**Exemplo:** alguém informa seu nome e senha para entrar em um site. Se os dados estiverem corretos, o sistema reconhece quem é essa pessoa.

**Autorização** é o processo de verificar o que a pessoa pode fazer.  
**Exemplo:** Quando alguém compartilha um documento do Google com você, o processo de autenticação seria o ato de entrar na sua conta. Já a autorização está ligada ao nível de acesso que você terá, como editar ou apenas ler o documento.

---

## Autenticação com Token (JWT)

A autenticação com **JWT (JSON Web Token)** funciona da seguinte forma: após o usuário fazer login com seus dados (como nome de usuário e senha), o sistema gera um token. Esse token é como um "comprovante" que contém informações sobre o usuário, parecido com um código especial.

Sempre que o usuário tenta acessar uma parte do sistema, ele envia o token junto com a requisição. O sistema então verifica o token para garantir que é válido e que o usuário tem permissão para continuar.

### O que é JWT?

O **JWT** é um formato de token que contém três partes principais:

- **Cabeçalho (Header):** Define o tipo de token e o algoritmo utilizado.
- **Corpo (Payload):** Contém as informações sobre o usuário.
- **Assinatura (Signature):** Garante que o token não foi alterado.

Com o JWT, o usuário não precisa enviar nome e senha a cada ação dentro do sistema, ele só envia o token até que expire.

**Exemplo:** Você vai a um evento e, na recepção, eles verificam seus documentos. Para não precisar mostrar os documentos toda vez que entrar em uma área restrita, eles te dão uma pulseira com seu nome, que garante o acesso a essas áreas de forma mais simples.

---

## Projeto (Objeto de Estudos)

### Interface de Login de Usuário

A interface de login de usuário deve ser clara, simples e intuitiva. Ela normalmente inclui:

- **Campos de entrada:** Nome de usuário ou email e senha.
- **Botão de login:** Inicia o processo de autenticação.
- **Esqueci minha senha:** Link para recuperação de senha.
- **Lembrar de mim:** Checkbox para manter o usuário conectado por mais tempo.
- **Login social:** Botões para login via contas externas, como Google ou Facebook.
