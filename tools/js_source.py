"""Small lexical reader for architecture checks; understands nested templates/comments.

This is a source policy checker, not a JavaScript parser or compiler. Browser tests
remain the authority for JavaScript execution.
"""

def quoted_end(source,start):
    i=start+1
    while i<len(source):
        if source[i]=='\\':i+=2
        elif source[i]==source[start]:return i+1
        else:i+=1
    raise ValueError('Unterminated JavaScript literal')

def brace_end(source,start):
    depth,i=1,start
    while depth and i<len(source):
        if source[i:i+2]=='//':
            end=source.find('\n',i);i=len(source) if end<0 else end
        elif source[i:i+2]=='/*':i=source.index('*/',i)+2
        elif source[i] in "'\"":i=quoted_end(source,i)
        elif source[i]=='`':i=template_parts(source,i)[0]
        elif source[i]=='{':depth+=1;i+=1
        elif source[i]=='}':depth-=1;i+=1
        else:i+=1
    if depth:raise ValueError('Unterminated template expression')
    return i-1

def template_parts(source,start):
    i=segment=start+1
    parts,expressions=[],[]
    while i<len(source):
        if source[i]=='\\':i+=2
        elif source[i:i+2]=='${':
            parts.append((source[segment:i],segment))
            end=brace_end(source,i+2)
            expressions.append((source[i+2:end],i+2))
            i=segment=end+1
        elif source[i]=='`':
            parts.append((source[segment:i],segment))
            return i+1,parts,expressions
        else:i+=1
    raise ValueError('Unterminated JavaScript template')

def literals(source,offset=0):
    i=0
    while i<len(source):
        if source[i:i+2]=='//':
            end=source.find('\n',i);i=len(source) if end<0 else end
        elif source[i:i+2]=='/*':i=source.index('*/',i)+2
        elif source[i] in "'\"":
            end=quoted_end(source,i)
            yield source[i+1:end-1],offset+i
            i=end
        elif source[i]=='`':
            end,parts,expressions=template_parts(source,i)
            for value,start in parts:yield value,offset+start
            for expression,start in expressions:yield from literals(expression,offset+start)
            i=end
        else:i+=1
