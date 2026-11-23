using Serilog.Core;
using Serilog.Events;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Guarda os eventos em memória para o teste inspecionar o que seria escrito.
/// Evita depender de arquivo de log — o mesmo motivo do <c>RateLimiting:Enabled</c>.
/// </summary>
public sealed class InMemorySink : ILogEventSink
{
    private readonly List<LogEvent> _events = [];

    public IReadOnlyList<LogEvent> Events
    {
        get
        {
            lock (_events)
            {
                return [.. _events];
            }
        }
    }

    public void Emit(LogEvent logEvent)
    {
        lock (_events)
        {
            _events.Add(logEvent);
        }
    }

    public void Clear()
    {
        lock (_events)
        {
            _events.Clear();
        }
    }
}
