-- =========================================================================
-- Dados de exemplo: 1 trilha (Engenharia de Sistemas) + 3 módulos reais
-- + questões de verdade (sem gabarito exposto ao cliente).
-- Rode DEPOIS de 0001_init.sql. Pode rodar de novo com segurança (idempotente).
-- =========================================================================

insert into public.tracks (id, slug, title, description, community_url, published)
values (
  '00000000-0000-4000-8000-000000000001',
  'engenharia-de-sistemas',
  'Engenharia de Sistemas',
  'Teoria de hardware, software, redes, dados, eletrônica e arquitetura — em português, gratuita, para quem já sabe programar e quer entender por que os sistemas funcionam como funcionam.',
  'https://discord.gg/SEU-CONVITE-AQUI',
  true
)
on conflict (id) do update set
  title = excluded.title, description = excluded.description, community_url = excluded.community_url;

-- ---------------------------------------------------------------------
-- MÓDULO 1 — Fundamentos
-- ---------------------------------------------------------------------
insert into public.modules (id, track_id, slug, order_index, phase_label, title, content_md, pass_threshold, published)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'fundamentos',
  1,
  'Fase 1',
  'Fundamentos: Lógica, Matemática Discreta e Algoritmos',
  $md$
## Objetivo
Entender a base matemática e lógica sobre a qual todo o resto do currículo se apoia: álgebra booleana, algoritmos, estruturas de dados, complexidade e teoria da computação.

## Por que começar aqui
Todo hardware digital é álgebra booleana implementada em silício. Toda decisão de arquitetura de software depende de entender complexidade. Sem isso, você decora receitas em vez de entender sistemas.

## Conteúdo desta fase
- Lógica proposicional, tabelas-verdade, quantificadores
- Álgebra booleana e simplificação (mapas de Karnaugh)
- Algoritmos: condicionais, laços, recursão
- Estruturas de dados: listas, pilhas, filas, árvores, hash
- Complexidade de algoritmos (notação Big O)
- Teoria da computação: autômatos e máquinas de Turing

## Curso principal recomendado
**Fundamentos de Matemática Discreta para a Computação (UFSC)** — inf.ufsc.br/~mauro.roisenberg/ine5403 — apostila + livro-texto completo, gratuito.

## Critério de domínio
Você está pronto para a prova quando conseguir: simplificar uma expressão booleana à mão, calcular a complexidade de um algoritmo simples, e explicar a diferença entre um autômato finito e uma máquina de Turing.

## Regra da prova
20 questões, mínimo de **80% de acerto** para desbloquear o próximo módulo. Questões discursivas ficam pendentes até revisão manual (até 24h).
$md$,
  80,
  true
)
on conflict (id) do update set content_md = excluded.content_md, title = excluded.title;

-- ---------------------------------------------------------------------
-- MÓDULO 2 — Arquitetura de Computadores
-- ---------------------------------------------------------------------
insert into public.modules (id, track_id, slug, order_index, phase_label, title, content_md, pass_threshold, published)
values (
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000001',
  'arquitetura-de-computadores',
  2,
  'Fase 2',
  'Como o computador funciona: CPU, memória, Assembly',
  $md$
## Objetivo
Rastrear um valor desde o código-fonte até o hardware: compilador → Assembly → instruções → CPU → memória.

## Pré-requisito
Módulo "Fundamentos" concluído (álgebra booleana é a base da ALU).

## Conteúdo desta fase
- Ciclo de instrução: fetch, decode, execute, write-back
- ALU, registradores, unidade de controle
- Hierarquia de memória: registradores → cache → RAM → armazenamento
- Barramentos, interrupções, DMA, pipeline
- Assembly x86 básico

## Curso principal recomendado
**Organização de Computadores (UNIVESP)** — playlist oficial no YouTube, 40h, cobre RISC/CISC, MIPS e Assembly.

## Critério de domínio
Você consegue desenhar de memória o ciclo fetch-decode-execute e explicar por que cache existe.
$md$,
  80,
  true
)
on conflict (id) do update set content_md = excluded.content_md, title = excluded.title;

-- ---------------------------------------------------------------------
-- MÓDULO 3 — Sistemas Operacionais
-- ---------------------------------------------------------------------
insert into public.modules (id, track_id, slug, order_index, phase_label, title, content_md, pass_threshold, published)
values (
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000001',
  'sistemas-operacionais',
  3,
  'Fase 3',
  'Sistemas Operacionais: processos, memória virtual, concorrência',
  $md$
## Objetivo
Entender como o SO administra processos, memória e concorrência — a base para diagnosticar qualquer sistema lento.

## Pré-requisito
Módulo "Arquitetura de Computadores" concluído.

## Conteúdo desta fase
- Processos vs. threads, troca de contexto
- Memória virtual, paginação, page fault, TLB
- Escalonamento (Round-Robin, prioridade)
- Deadlocks e suas 4 condições
- Concorrência, race conditions, mutex

## Curso principal recomendado
**Sistemas Operacionais (UNIVESP)** — playlist oficial, 80h, baseado em Tanenbaum e Silberschatz.

## Critério de domínio
Você consegue explicar, sem consulta, o caminho completo de um endereço virtual até o dado físico — inclusive o caso de page fault.
$md$,
  80,
  true
)
on conflict (id) do update set content_md = excluded.content_md, title = excluded.title;

-- =========================================================================
-- QUESTÕES — Módulo 1 (Fundamentos)
-- =========================================================================
insert into public.questions (id, module_id, order_index, type, prompt, options, points) values
('00000000-0000-4000-8000-000000001101','00000000-0000-4000-8000-000000000101',1,'multiple_choice',
  '¬(A ∨ B) equivale a:',
  '[{"id":"a","label":"¬A ∨ ¬B"},{"id":"b","label":"¬A ∧ ¬B"},{"id":"c","label":"A ∧ B"},{"id":"d","label":"A ∨ B"}]', 5),
('00000000-0000-4000-8000-000000001102','00000000-0000-4000-8000-000000000101',2,'multiple_choice',
  'A porta lógica chamada "universal", capaz de implementar qualquer função booleana sozinha, é:',
  '[{"id":"a","label":"AND"},{"id":"b","label":"OR"},{"id":"c","label":"NAND"},{"id":"d","label":"XOR"}]', 5),
('00000000-0000-4000-8000-000000001103','00000000-0000-4000-8000-000000000101',3,'multiple_choice',
  'A complexidade de busca binária num array ordenado é:',
  '[{"id":"a","label":"O(1)"},{"id":"b","label":"O(n)"},{"id":"c","label":"O(log n)"},{"id":"d","label":"O(n²)"}]', 5),
('00000000-0000-4000-8000-000000001104','00000000-0000-4000-8000-000000000101',4,'multiple_choice',
  'Uma pilha (stack) segue a política:',
  '[{"id":"a","label":"FIFO"},{"id":"b","label":"LIFO"},{"id":"c","label":"Round-robin"},{"id":"d","label":"Prioridade"}]', 5),
('00000000-0000-4000-8000-000000001105','00000000-0000-4000-8000-000000000101',5,'multiple_choice',
  'O pior caso do Quicksort é:',
  '[{"id":"a","label":"O(n)"},{"id":"b","label":"O(n log n)"},{"id":"c","label":"O(n²)"},{"id":"d","label":"O(2ⁿ)"}]', 5),
('00000000-0000-4000-8000-000000001106','00000000-0000-4000-8000-000000000101',6,'true_false',
  'O problema da parada (halting problem) é indecidível: não existe algoritmo geral capaz de resolvê-lo para qualquer programa.',
  null, 5),
('00000000-0000-4000-8000-000000001107','00000000-0000-4000-8000-000000000101',7,'true_false',
  'A notação Big O mede o tempo real de execução em segundos de um algoritmo.',
  null, 5),
('00000000-0000-4000-8000-000000001108','00000000-0000-4000-8000-000000000101',8,'discursive',
  'Explique, com suas próprias palavras, por que a complexidade assintótica (Big O) ignora constantes — e dê um exemplo em que essa simplificação pode enganar na prática (para valores pequenos de n).',
  null, 20)
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options;

insert into public.question_answers (question_id, correct_option_id, correct_boolean, model_answer) values
('00000000-0000-4000-8000-000000001101','b', null, null),
('00000000-0000-4000-8000-000000001102','c', null, null),
('00000000-0000-4000-8000-000000001103','c', null, null),
('00000000-0000-4000-8000-000000001104','b', null, null),
('00000000-0000-4000-8000-000000001105','c', null, null),
('00000000-0000-4000-8000-000000001106', null, true, null),
('00000000-0000-4000-8000-000000001107', null, false, null),
('00000000-0000-4000-8000-000000001108', null, null,
  'Boa resposta cita: Big O descreve crescimento assintótico (comportamento quando n → ∞), não tempo real medido em segundos, que depende de hardware/linguagem. Para n pequeno, um algoritmo O(n²) com constante baixa pode ser mais rápido na prática que um O(n log n) com constante alta — exemplo aceitável: Insertion Sort (O(n²)) muitas vezes vence Merge Sort (O(n log n)) para arrays pequenos.')
on conflict (question_id) do update set
  correct_option_id = excluded.correct_option_id,
  correct_boolean = excluded.correct_boolean,
  model_answer = excluded.model_answer;

-- =========================================================================
-- QUESTÕES — Módulo 2 (Arquitetura de Computadores)
-- =========================================================================
insert into public.questions (id, module_id, order_index, type, prompt, options, points) values
('00000000-0000-4000-8000-000000001201','00000000-0000-4000-8000-000000000102',1,'multiple_choice',
  'Coloque em ordem o ciclo de instrução — qual é a primeira etapa?',
  '[{"id":"a","label":"Execute"},{"id":"b","label":"Fetch (busca)"},{"id":"c","label":"Write-back"},{"id":"d","label":"Decode"}]', 5),
('00000000-0000-4000-8000-000000001202','00000000-0000-4000-8000-000000000102',2,'multiple_choice',
  'A ALU é responsável por:',
  '[{"id":"a","label":"Armazenar o programa"},{"id":"b","label":"Executar operações aritméticas e lógicas"},{"id":"c","label":"Gerenciar interrupções de disco"},{"id":"d","label":"Traduzir endereços virtuais"}]', 5),
('00000000-0000-4000-8000-000000001203','00000000-0000-4000-8000-000000000102',3,'multiple_choice',
  'Um cache miss ocorre quando:',
  '[{"id":"a","label":"O dado está no cache"},{"id":"b","label":"O dado não está no cache e precisa ser buscado na RAM"},{"id":"c","label":"A CPU trava"},{"id":"d","label":"O barramento falha"}]', 5),
('00000000-0000-4000-8000-000000001204','00000000-0000-4000-8000-000000000102',4,'true_false',
  'Registradores são a memória mais rápida disponível para a CPU, mais rápidos que o cache L1.',
  null, 5),
('00000000-0000-4000-8000-000000001205','00000000-0000-4000-8000-000000000102',5,'true_false',
  'DMA (Direct Memory Access) existe para permitir que periféricos transfiram dados para a RAM sem ocupar a CPU a cada byte.',
  null, 5),
('00000000-0000-4000-8000-000000001206','00000000-0000-4000-8000-000000000102',6,'discursive',
  'Explique localidade temporal e localidade espacial com um exemplo de código, e diga por que percorrer uma matriz por linha costuma ser mais rápido que por coluna.',
  null, 20)
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options;

insert into public.question_answers (question_id, correct_option_id, correct_boolean, model_answer) values
('00000000-0000-4000-8000-000000001201','b', null, null),
('00000000-0000-4000-8000-000000001202','b', null, null),
('00000000-0000-4000-8000-000000001203','b', null, null),
('00000000-0000-4000-8000-000000001204', null, true, null),
('00000000-0000-4000-8000-000000001205', null, true, null),
('00000000-0000-4000-8000-000000001206', null, null,
  'Boa resposta cita: localidade temporal = dado acessado recentemente tende a ser acessado de novo; localidade espacial = dados próximos na memória tendem a ser acessados juntos. Percorrer por linha segue a ordem física da matriz na memória (row-major), gerando menos cache miss que percorrer por coluna, que salta pela memória.')
on conflict (question_id) do update set
  correct_option_id = excluded.correct_option_id,
  correct_boolean = excluded.correct_boolean,
  model_answer = excluded.model_answer;

-- =========================================================================
-- QUESTÕES — Módulo 3 (Sistemas Operacionais)
-- =========================================================================
insert into public.questions (id, module_id, order_index, type, prompt, options, points) values
('00000000-0000-4000-8000-000000001301','00000000-0000-4000-8000-000000000103',1,'multiple_choice',
  'O componente que mantém o estado de um processo (registradores, tabela de páginas, arquivos abertos) é:',
  '[{"id":"a","label":"TLB"},{"id":"b","label":"PCB (Process Control Block)"},{"id":"c","label":"MMU"},{"id":"d","label":"Cache L1"}]', 5),
('00000000-0000-4000-8000-000000001302','00000000-0000-4000-8000-000000000103',2,'multiple_choice',
  'Um page fault ocorre quando:',
  '[{"id":"a","label":"A CPU trava"},{"id":"b","label":"A página requisitada não está na RAM"},{"id":"c","label":"Há um erro de sintaxe"},{"id":"d","label":"O cache está cheio"}]', 5),
('00000000-0000-4000-8000-000000001303','00000000-0000-4000-8000-000000000103',3,'multiple_choice',
  'Um deadlock ocorre quando:',
  '[{"id":"a","label":"Um processo termina rápido"},{"id":"b","label":"Dois ou mais processos esperam indefinidamente um recurso que o outro segura"},{"id":"c","label":"A CPU está ociosa"},{"id":"d","label":"Há excesso de memória livre"}]', 5),
('00000000-0000-4000-8000-000000001304','00000000-0000-4000-8000-000000000103',4,'true_false',
  'Threads do mesmo processo compartilham heap e código, mas cada uma tem sua própria pilha.',
  null, 5),
('00000000-0000-4000-8000-000000001305','00000000-0000-4000-8000-000000000103',5,'true_false',
  'Troca de contexto entre dois processos é mais barata que entre duas threads do mesmo processo.',
  null, 5),
('00000000-0000-4000-8000-000000001306','00000000-0000-4000-8000-000000000103',6,'discursive',
  'Um servidor de produção trava esporadicamente sob alta carga, com múltiplos threads presos aguardando uns aos outros. Descreva como você investigaria a hipótese de deadlock e que mudança de design proporia para evitar recorrência.',
  null, 25)
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options;

insert into public.question_answers (question_id, correct_option_id, correct_boolean, model_answer) values
('00000000-0000-4000-8000-000000001301','b', null, null),
('00000000-0000-4000-8000-000000001302','b', null, null),
('00000000-0000-4000-8000-000000001303','b', null, null),
('00000000-0000-4000-8000-000000001304', null, true, null),
('00000000-0000-4000-8000-000000001305', null, false, null),
('00000000-0000-4000-8000-000000001306', null, null,
  'Boa resposta cita: identificar as 4 condições de deadlock (exclusão mútua, posse e espera, não-preempção, espera circular); investigar logs/dumps de threads para achar o ciclo de espera; e propor mudança como impor ordem consistente de aquisição de locks, usar timeout em locks, ou reduzir granularidade de seções críticas.')
on conflict (question_id) do update set
  correct_option_id = excluded.correct_option_id,
  correct_boolean = excluded.correct_boolean,
  model_answer = excluded.model_answer;

-- =========================================================================
-- Fim do seed. Para adicionar uma nova trilha/módulo, copie o padrão acima
-- com um novo id (ex.: prefixo '00000000-0000-4000-8000-000000000002...').
-- =========================================================================
