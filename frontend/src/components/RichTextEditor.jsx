import { useRef, useEffect, useState } from 'react';
import {
  Box,
  Toolbar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Code,
  FormatQuote,
  Undo,
  Redo,
} from '@mui/icons-material';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing...", 
  minHeight = '300px' 
}) => {
  const editorRef = useRef(null);
  const [selectedFormats, setSelectedFormats] = useState([]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleFormatChange = (event, newFormats) => {
    setSelectedFormats(newFormats);
  };

  // Check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // Check for common URL patterns without protocol
      const urlPattern = /^(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
      return urlPattern.test(string);
    }
  };

  // Normalize URL (add https:// if missing)
  const normalizeUrl = (url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get clipboard data
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    
    // Get current selection
    const selection = window.getSelection();
    
    // Check if there's selected text and pasted content is a URL
    if (selection.rangeCount > 0 && !selection.isCollapsed && isValidUrl(pastedText.trim())) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = normalizeUrl(pastedText.trim());
      link.textContent = selectedText;
      link.target = '_blank'; // Open in new tab
      link.rel = 'noopener noreferrer'; // Security best practice
      
      // Replace selected text with the link
      range.deleteContents();
      range.insertNode(link);
      
      // Clear selection and position cursor after the link
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.addRange(newRange);
      
      handleInput();
    } else {
      // Normal paste behavior for non-URLs or when no text is selected
      const text = pastedText;
      document.execCommand('insertText', false, text);
      handleInput();
    }
  };

  const insertLink = () => {
    const selection = window.getSelection();
    let selectedText = '';
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      selectedText = selection.toString();
    }
    
    const url = prompt('Enter URL:', 'https://');
    if (url && url !== 'https://') {
      if (selectedText) {
        // If text is selected, create link with selected text
        execCommand('createLink', normalizeUrl(url));
      } else {
        // If no text selected, insert the URL as both text and link
        const link = document.createElement('a');
        link.href = normalizeUrl(url);
        link.textContent = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        const range = selection.getRangeAt(0);
        range.insertNode(link);
        
        // Position cursor after the link
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        handleInput();
      }
    }
  };

  const insertList = (type) => {
    if (type === 'bullet') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  const handleKeyDown = (e) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <Box sx={{ 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          minHeight: '48px !important',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50',
          gap: 1,
          flexWrap: 'wrap',
          py: 1,
          px: 2
        }}
      >
        {/* Text Formatting */}
        <ToggleButtonGroup
          size="small"
          value={selectedFormats}
          onChange={handleFormatChange}
          sx={{ mr: 1 }}
        >
          <ToggleButton value="bold" onClick={() => execCommand('bold')}>
            <Tooltip title="Bold (Ctrl+B)">
              <FormatBold fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="italic" onClick={() => execCommand('italic')}>
            <Tooltip title="Italic (Ctrl+I)">
              <FormatItalic fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="underline" onClick={() => execCommand('underline')}>
            <Tooltip title="Underline (Ctrl+U)">
              <FormatUnderlined fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Lists */}
        <IconButton size="small" onClick={() => insertList('bullet')}>
          <Tooltip title="Bullet List">
            <FormatListBulleted fontSize="small" />
          </Tooltip>
        </IconButton>
        <IconButton size="small" onClick={() => insertList('numbered')}>
          <Tooltip title="Numbered List">
            <FormatListNumbered fontSize="small" />
          </Tooltip>
        </IconButton>

        <Divider orientation="vertical" flexItem />

        {/* Special Elements */}
        <IconButton size="small" onClick={insertLink}>
          <Tooltip title="Insert Link (Ctrl+K)">
            <LinkIcon fontSize="small" />
          </Tooltip>
        </IconButton>
        <IconButton size="small" onClick={() => execCommand('formatBlock', 'blockquote')}>
          <Tooltip title="Quote">
            <FormatQuote fontSize="small" />
          </Tooltip>
        </IconButton>
        <IconButton size="small" onClick={() => execCommand('formatBlock', 'pre')}>
          <Tooltip title="Code Block">
            <Code fontSize="small" />
          </Tooltip>
        </IconButton>

        <Divider orientation="vertical" flexItem />

        {/* History */}
        <IconButton size="small" onClick={() => execCommand('undo')}>
          <Tooltip title="Undo (Ctrl+Z)">
            <Undo fontSize="small" />
          </Tooltip>
        </IconButton>
        <IconButton size="small" onClick={() => execCommand('redo')}>
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <Redo fontSize="small" />
          </Tooltip>
        </IconButton>
      </Toolbar>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        sx={{
          minHeight,
          p: 2,
          outline: 'none',
          fontSize: '1rem',
          lineHeight: 1.6,
          backgroundColor: 'background.paper',
          cursor: 'text',
          '&:empty::before': {
            content: `"${placeholder}"`,
            color: 'text.disabled',
            fontStyle: 'italic',
            pointerEvents: 'none',
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            pl: 2,
            ml: 0,
            my: 1,
            fontStyle: 'italic',
            backgroundColor: 'grey.50',
            py: 1,
            borderRadius: '0 4px 4px 0',
          },
          '& pre': {
            backgroundColor: 'grey.100',
            p: 1,
            borderRadius: 1,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            my: 1,
          },
          '& ul, & ol': {
            pl: 3,
            my: 1,
          },
          '& li': {
            mb: 0.5,
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'none',
            },
          },
          '& p': {
            margin: '0.5em 0',
            '&:first-of-type': {
              marginTop: 0,
            },
            '&:last-of-type': {
              marginBottom: 0,
            },
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            margin: '1em 0 0.5em 0',
            '&:first-of-type': {
              marginTop: 0,
            },
          },
        }}
        suppressContentEditableWarning={true}
      />
    </Box>
  );
};

export default RichTextEditor;