import React, { useEffect, useState } from 'react';
import { FileText, Folder, Plus, Trash2, Search, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface Document {
  id: string;
  name: string;
  collection: string;
  upload_time: string;
}

interface DocumentLibraryProps {
  onSelectCollection: (collection: string | null) => void;
  onSelectDocument: (name: string, url: string) => void;
  activeCollection: string | null;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ 
  onSelectCollection, 
  onSelectDocument,
  activeCollection 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetadata = async () => {
    try {
      const response = await axios.get('http://localhost:8001/documents');
      setDocuments(response.data.documents);
      setCollections(response.data.collections);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    // Refresh every 10 seconds to catch new uploads
    const interval = setInterval(fetchMetadata, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`http://localhost:8001/documents/${docId}`);
      fetchMetadata();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          Document Library
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Collections Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collections</p>
          <button
            onClick={() => onSelectCollection(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
              activeCollection === null 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            )}
          >
            <Folder size={14} />
            <span>All Documents</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
              {documents.length}
            </Badge>
          </button>
          
          {collections.map((col) => (
            <button
              key={col}
              onClick={() => onSelectCollection(col)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                activeCollection === col 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <Folder size={14} />
              <span>{col}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                {documents.filter(d => d.collection === col).length}
              </Badge>
            </button>
          ))}
        </div>

        {/* Documents List */}
        <div className="space-y-1 pt-2">
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documents</p>
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : documents.length === 0 ? (
            <p className="px-2 py-4 text-xs text-slate-400 text-center">No documents uploaded yet.</p>
          ) : (
            documents
              .filter(d => !activeCollection || d.collection === activeCollection)
              .map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.name, `http://localhost:8001/uploads/${doc.id}_${doc.name}`)}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FileText size={12} className="flex-shrink-0" />
                  <span className="truncate flex-1" title={doc.name}>{doc.name}</span>
                  <button 
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="outline" size="sm" className="w-full text-xs gap-2 py-4" onClick={() => window.location.reload()}>
          <Plus size={14} />
          Upload New PDF
        </Button>
      </div>
    </div>
  );
};
