/**
 * ⚠️ REMOVIDO
 * 
 * Este endpoint de webhook foi removido em favor do polling automático.
 * 
 * O cliente agora consulta o status via GET /api/jobs/[jobId]
 * com o hook useTranscriptionPolling a cada 2 segundos.
 * 
 * Isso elimina a necessidade de manter uma rota webhook e
 * funciona melhor em desenvolvimento (localhost) e em ambientes
 * com restrições de firewall.
 * 
 * Arquivo pode ser deletado completamente.
 */
