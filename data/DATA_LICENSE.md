# Licença dos Datasets

Este arquivo descreve as licenças e boas práticas para uso de datasets neste repositório.

## Licença dos dados

- **CC0 1.0 (Domínio Público)**  
  Pode ser usado, modificado e distribuído livremente, sem necessidade de atribuição.

- **CC BY 4.0 (Atribuição)**  
  Permite uso, modificação e distribuição, **desde que o autor original seja citado**.

> Escolha a licença adequada ao dataset que você está usando. Sempre respeite a licença original.

## Boas práticas

- **Nunca inclua dados pessoais reais** em repositórios públicos.  
- **Dados sensíveis** devem ser armazenados em local seguro:
  - AWS S3 privado
  - Google Cloud Storage
  - Azure Blob privado
- No repositório público, inclua apenas:
  - Scripts para baixar ou gerar os dados (`fetch_data.py`, notebooks, etc.)
  - Dados de exemplo ou dummy data que não contenham informações pessoais.

## Versionamento de datasets grandes

Se precisar versionar datasets grandes (ex.: CSVs, parquet):

```bash
# Instalar Git LFS (apenas uma vez)
git lfs install

# Rastrear arquivos grandes na pasta data
git lfs track "data/*.csv"

# Adicionar alterações do LFS
git add .gitattributes
git commit -m "Track data with Git LFS"

