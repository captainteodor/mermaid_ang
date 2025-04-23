import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'app-sample-diagrams',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './sample-diagrams.component.html',
  styleUrl: './sample-diagrams.component.scss'
})
export class SampleDiagramsComponent {
  private diagramState = inject(DiagramStateService);

  // Add an event emitter for closing the dialog
  @Output() closeDialog = new EventEmitter<void>();

  samples = {
    flowchart: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,

    sequence: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,

    class: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`,

    state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,

    er: `erDiagram
    CUSTOMER }|..|{ DELIVERY-ADDRESS : has
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ INVOICE : "liable for"
    DELIVERY-ADDRESS ||--o{ ORDER : receives
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"`,

    gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,

    pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  };

  categories = [
    { name: 'Flowchart', key: 'flowchart', icon: 'diagram-tree' },
    { name: 'Sequence Diagram', key: 'sequence', icon: 'list-numbered' },
    { name: 'Class Diagram', key: 'class', icon: 'module' },
    { name: 'State Diagram', key: 'state', icon: 'network' },
    { name: 'Entity Relationship', key: 'er', icon: 'share' },
    { name: 'Gantt Chart', key: 'gantt', icon: 'calendar' },
    { name: 'Pie Chart', key: 'pie', icon: 'pie' }
  ];

  selectSample(key: string): void {
    this.diagramState.updateCode(this.samples[key as keyof typeof this.samples], {
      updateDiagram: true,
      resetPanZoom: true
    });
    this.close();
  }

  getSamplePreview(key: string): string {
    // Use type assertion to tell TypeScript that key is valid
    const sample = this.samples[key as keyof typeof this.samples];
    if (!sample) return '';
    return sample.substring(0, 100) + (sample.length > 100 ? '...' : '');
  }

  // Helper method to close the dialog
  close(): void {
    this.closeDialog.emit();
  }
}
