import os
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urljoin
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain.chains import RetrievalQA
from langchain_core.documents import Document

# --- CONFIGURATION ---
# The directory to store the vector databases for each organization
DB_BASE_PATH = "fundspace_db"
os.makedirs(DB_BASE_PATH, exist_ok=True)

# List of organizations to scrape. You can expand this.
ORGANIZATIONS = [
    {"name": "Redwood City Together", "url": "https://www.rwctogether.org/"},
    {"name": "Thrive Alliance", "url": "https://www.thrivealliance.org/"},
    # Add more organizations here!
]

# --- UTILITY FUNCTIONS ---
def get_sitemap_urls(base_url):
    """
    Scrapes a website's sitemap.xml to get a list of all URLs.
    """
    sitemap_url = urljoin(base_url, 'sitemap.xml')
    try:
        response = requests.get(sitemap_url)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        urls = [elem.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text
                for elem in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}url')]
        print(f"Found {len(urls)} URLs in the sitemap for {base_url}.")
        return urls
    except requests.exceptions.RequestException as e:
        print(f"Error fetching sitemap for {base_url}: {e}")
        return [base_url]  # Fallback to the base URL
    except ET.ParseError:
        print(f"Could not parse sitemap for {base_url}. Falling back to base URL.")
        return [base_url] # Fallback to the base URL

def create_and_populate_db(org_name, urls):
    """
    Scrapes the given URLs, chunks the content, and creates a vector database.
    The database is saved in a folder named after the organization.
    """
    db_path = os.path.join(DB_BASE_PATH, org_name.replace(" ", "_"))
    os.makedirs(db_path, exist_ok=True)

    print(f"Scraping websites for {org_name}...")
    loader = WebBaseLoader(web_path=urls)
    docs = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    print(f"Loaded and split {len(docs)} documents into {len(splits)} chunks.")

    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=db_path
    )
    print(f"Vector database for {org_name} created and populated at {db_path}.")
    return vectorstore

def get_answer(question, org_name):
    """
    Gets an answer from the LLM based on the specified organization's data.
    """
    db_path = os.path.join(DB_BASE_PATH, org_name.replace(" ", "_"))
    if not os.path.exists(db_path):
        return f"Error: No data found for {org_name}. Please scrape and index the website first."

    print(f"Starting Llama 3 for question answering on {org_name}'s data...")
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectorstore = Chroma(persist_directory=db_path, embedding_function=embeddings)
    
    local_llm = Ollama(model="llama3")
    retriever = vectorstore.as_retriever()
    
    qa_chain = RetrievalQA.from_chain_type(
        llm=local_llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
    
    response = qa_chain.invoke({"query": question})

    return response['result']

if __name__ == "__main__":
    # Loop through all organizations and process their data.
    for org in ORGANIZATIONS:
        print(f"\n--- Processing {org['name']} ---")
        urls_to_scrape = get_sitemap_urls(org['url'])
        create_and_populate_db(org['name'], urls_to_scrape)

    # Now ask a question about one of the organizations.
    org_to_query = ORGANIZATIONS[1]['name']  # Thrive Alliance
    question = "What is the mission of the organization?"
    answer = get_answer(question, org_to_query)

    print(f"\nQuestion: {question}")
    print(f"Answer: {answer}")
