using Serilog.Core;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Serializa os eventos com o mesmo <see cref="CompactJsonFormatter"/> usado em
/// produção e guarda o texto. É o que permite afirmar sobre o JSON que sairia no
/// console, sem escrever em disco nem depender de arquivo de log.
/// </summary>
public sealed class JsonLogSink : ILogEventSink
{
    private readonly CompactJsonFormatter _formatter = new();
    private readonly List<string> _lines = [];

    public IReadOnlyList<string> Lines
    {
        get
        {
            lock (_lines)
            {
                return [.. _lines];
            }
        }
    }

    public void Emit(LogEvent logEvent)
    {
        using var writer = new StringWriter();
        _formatter.Format(logEvent, writer);

        lock (_lines)
        {
            _lines.Add(writer.ToString());
        }
    }
}
